import { TestBed } from '@angular/core/testing';

import { of, Subject } from 'rxjs';

import { AppComponent } from './app.component';
import { StockService } from './stock.service';

// Today's session is already in Alpha Vantage's daily series, so its last
// close is the live price: comparing the two can't tell the direction.
const LAST_CLOSE = 340.97;

// Closes run oldest to newest; Alpha Vantage lists the newest date first.
function daily(closes: number[]) {
  const series: Record<string, Record<string, string>> = {};
  [...closes].reverse().forEach((close, i) => {
    series[`2026-10-${String(closes.length - i).padStart(2, '0')}`] = { '4. close': String(close), '5. volume': '1000' };
  });
  return { 'Time Series (Daily)': series };
}

// The daily series resolves after the quote, as it can over the network.
function addStock(quote: { c: number; d: number | null; dp: number | null }, closes: number[]): boolean | null {
  const dailyData = new Subject<ReturnType<typeof daily>>();
  const stub: Partial<StockService> = {
    getDailyData: () => dailyData as unknown as ReturnType<StockService['getDailyData']>,
    getCurrentPrice: () => of(quote) as ReturnType<StockService['getCurrentPrice']>,
    getCompanyData: () => of({}) as ReturnType<StockService['getCompanyData']>,
    getStockNews: () => of([]) as ReturnType<StockService['getStockNews']>,
  };
  TestBed.configureTestingModule({ providers: [{ provide: StockService, useValue: stub }] });
  TestBed.overrideComponent(AppComponent, { set: { template: '', imports: [] } });
  const app = TestBed.createComponent(AppComponent).componentInstance;
  app.addNewStock({ name: 'Apple Inc', symbol: 'AAPL' });
  dailyData.next(daily(closes));
  return app.selectedStocks()[0].isRising;
}

describe('AppComponent price direction', () => {
  beforeEach(() => sessionStorage.clear());

  it('is rising when the quote is up, even though the live price equals the last daily close', () => {
    expect(addStock({ c: LAST_CLOSE, d: 4.33, dp: 1.29 }, [330, 336.64, LAST_CLOSE])).toBe(true);
  });

  it('is falling when the quote is down, even though the price is above an older close', () => {
    expect(addStock({ c: LAST_CLOSE, d: -2.1, dp: -0.61 }, [330, 343.07, 300])).toBe(false);
  });

  it('shows no direction when the quote has no change (an unknown symbol)', () => {
    expect(addStock({ c: 0, d: null, dp: null }, [330, 336.64, LAST_CLOSE])).toBeNull();
  });
});
