import { TestBed } from '@angular/core/testing';

import { of, Subject, throwError } from 'rxjs';

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

describe('AppComponent load states', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  // Every request answers at once with the given body, or fails when it is an Error.
  function load(bodies: Partial<Record<'quote' | 'daily' | 'company' | 'news', unknown>>) {
    const answer = (body: unknown) => (body instanceof Error ? throwError(() => body) : of(body));
    const stub: Partial<StockService> = {
      getCurrentPrice: () => answer(bodies.quote ?? { c: 1, d: 1, dp: 1 }) as ReturnType<StockService['getCurrentPrice']>,
      getDailyData: () => answer(bodies.daily ?? daily([1, 2])) as ReturnType<StockService['getDailyData']>,
      getCompanyData: () => answer(bodies.company ?? { ticker: 'AAPL', name: 'Apple Inc' }) as ReturnType<StockService['getCompanyData']>,
      getStockNews: () => answer(bodies.news ?? []) as ReturnType<StockService['getStockNews']>,
    };
    TestBed.configureTestingModule({ providers: [{ provide: StockService, useValue: stub }] });
    TestBed.overrideComponent(AppComponent, { set: { template: '', imports: [] } });
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.addNewStock({ name: 'Apple Inc', symbol: 'AAPL' });
    return { app, stub, stock: () => app.selectedStocks()[0] };
  }

  it('ends every part ready when each request answers', () => {
    expect(load({}).stock().load).toEqual({ quote: 'ready', history: 'ready', company: 'ready', news: 'ready' });
  });

  it('marks the company failed when its request errors, and a retry fills it', () => {
    const { app, stub, stock } = load({ company: new Error('429') });
    expect(stock().load.company).toBe('error');

    stub.getCompanyData = () => of({ ticker: 'AAPL', name: 'Apple Inc' }) as ReturnType<StockService['getCompanyData']>;
    app.retry({ symbol: 'AAPL', part: 'company' });
    expect(stock().load.company).toBe('ready');
    expect(stock().company.name).toBe('Apple Inc');
  });

  it('marks the company failed when a notice arrives in place of a profile', () => {
    const { stock } = load({ company: { error: 'API limit reached' } });
    expect(stock().load.company).toBe('error');
  });

  it('treats a fund with no profile as ready and empty, not failed', () => {
    const { stock } = load({ company: {} });
    expect(stock().load.company).toBe('ready');
    expect(stock().company.name).toBeUndefined();
  });

  it('marks history, quote and news failed when their requests error and nothing is cached', () => {
    const { stock } = load({ daily: new Error('500'), quote: new Error('500'), news: new Error('500') });
    expect(stock().load).toEqual({ quote: 'error', history: 'error', company: 'ready', news: 'error' });
  });

  it('falls back to cached history when the daily request is rate-limited', () => {
    sessionStorage.setItem('AAPL', JSON.stringify([{ date: '2026-10-01', close: 5, volume: 1, dividend: 0 }]));
    const { stock } = load({ daily: { Information: 'rate limit' } });
    expect(stock().load.history).toBe('ready');
    expect(stock().priceHistory[0].close).toBe(5);
  });

  it('undoes a removal back into the same place', () => {
    const { app } = load({});
    app.addNewStock({ name: 'Microsoft', symbol: 'MSFT' });
    app.removeStock(app.selectedStocks()[0]);
    expect(app.selectedStocks().map((s) => s.symbol)).toEqual(['MSFT']);
    app.undoRemove();
    expect(app.selectedStocks().map((s) => s.symbol)).toEqual(['AAPL', 'MSFT']);
    expect(app.removed()).toBeNull();
  });

  it('restores the saved portfolio on load, purchases and all, and charts them', () => {
    localStorage.setItem('marian.portfolio', JSON.stringify([
      { symbol: 'AAPL', name: 'Apple Inc', shares: [{ date: '2026/10/01', number: 3, price: 1 }] },
      { symbol: 'MSFT', name: 'Microsoft', shares: [] },
    ]));
    const stub: Partial<StockService> = {
      getCurrentPrice: () => of({ c: 1, d: 1, dp: 1 }) as ReturnType<StockService['getCurrentPrice']>,
      getDailyData: () => of(daily([1, 2])) as ReturnType<StockService['getDailyData']>,
      getCompanyData: () => of({}) as ReturnType<StockService['getCompanyData']>,
      getStockNews: () => of([]) as ReturnType<StockService['getStockNews']>,
    };
    TestBed.configureTestingModule({ providers: [{ provide: StockService, useValue: stub }] });
    TestBed.overrideComponent(AppComponent, { set: { template: '', imports: [] } });
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.ngOnInit();

    expect(app.isLandingPage).toBe(false);
    expect(app.selectedStocks().map((s) => [s.symbol, s.isCollapsed, s.shares.length])).toEqual([['AAPL', true, 2], ['MSFT', false, 1]]);
    expect(app.selectedStocks()[0].shares[0]).toMatchObject({ date: '2026/10/01', number: 3, price: 1, dateError: null });
    expect(app.selectedStocks()[0].load.history).toBe('ready');
    expect(app.renderNetChart).toBe(true);
  });

  it('saves each change, and Clear forgets everything until Undo', () => {
    const { app } = load({});
    app.addNewStock({ name: 'Microsoft', symbol: 'MSFT' });
    const saved = () => JSON.parse(localStorage.getItem('marian.portfolio') ?? '[]').map((s: { symbol: string }) => s.symbol);
    expect(saved()).toEqual(['AAPL', 'MSFT']);

    app.clearPortfolio();
    expect(app.selectedStocks()).toEqual([]);
    expect(app.isLandingPage).toBe(true);
    expect(localStorage.getItem('marian.portfolio')).toBeNull();

    app.undoRemove();
    expect(app.selectedStocks().map((s) => s.symbol)).toEqual(['AAPL', 'MSFT']);
    expect(saved()).toEqual(['AAPL', 'MSFT']);
  });

  it('leaving an empty page keeps a portfolio saved elsewhere', () => {
    const { app } = load({});
    app.clearPortfolio();
    localStorage.setItem('marian.portfolio', '[{"symbol":"MSFT","name":"Microsoft","shares":[]}]');
    app.saveOnLeave();
    expect(localStorage.getItem('marian.portfolio')).toContain('MSFT');
  });
});
