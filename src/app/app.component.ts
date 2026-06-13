import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { interval } from 'rxjs';

import { Article } from './article';
import { Share } from './share';
import { Stock, StockSelection } from './stock';
import { StockService } from './stock.service';
import { SYMBOLS } from './symbols';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { NetChartComponent } from './net-chart/net-chart.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { SearchComponent } from './search/search.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [HeaderComponent, SearchComponent, NetChartComponent, PortfolioComponent, FooterComponent],
})
export class AppComponent implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetector = inject(ChangeDetectorRef);

  // Whether the user is on the landing page.
  isLandingPage = true;

  // Whether the net equity chart should be rendered.
  renderNetChart = false;

  // The stocks in the user's portfolio.
  readonly selectedStocks = signal<Stock[]>([]);

  // Whether the net equity chart should be updated.
  updateNetChart = false;

  // Known stock symbols, used to filter news "related" symbols.
  private readonly symbols: string[] = SYMBOLS;

  ngOnInit(): void {
    // During market hours, refresh each loaded stock's price every minute.
    if (this.isMarketOpen()) {
      interval(60000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.selectedStocks().forEach((stock) => {
            if (stock.priceHistory.length) {
              this.getCurrentPrice(stock.symbol);
            }
          });
        });
    }
  }

  /* Whether the US stock market is currently open (Mon–Fri, 9:30 AM–4:00 PM
  Eastern). Uses the America/New_York time zone so it stays correct across DST. */
  private isMarketOpen(): boolean {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
    const weekday = part('weekday');
    const hour = Number(part('hour')) % 24;
    const minute = Number(part('minute'));
    const time = hour + minute / 60;

    const isWeekday = weekday !== 'Sat' && weekday !== 'Sun';
    return isWeekday && time >= 9.5 && hour < 16;
  }

  /* Add an empty share to the specified stock so the user can enter another
  share for it. */
  addNewShare(symbol: string): void {
    const stocks = this.selectedStocks();
    const stockIndex = stocks.findIndex((stock) => stock.symbol === symbol);

    // Only add an empty share if the stock does not already have one.
    const includesEmpty = stocks[stockIndex].shares.some((share) => share.date === null);

    if (!includesEmpty) {
      stocks[stockIndex].shares.push(this.createEmptyShare());
      this.selectedStocks.set([...stocks]);
    }

    this.displayNetChart();
  }

  // Add a new stock to the selected stocks list.
  addNewStock(stock: StockSelection): void {
    const stocks = this.selectedStocks();

    // If the stock is already in the portfolio, scroll to it.
    if (stocks.some((obj) => obj.symbol === stock.symbol)) {
      document.getElementById(stock.symbol)?.scrollIntoView();
      return;
    }

    // Switch from the landing page to the portfolio view.
    this.isLandingPage = false;

    // Collapse all previously added stocks.
    stocks.forEach((obj) => (obj.isCollapsed = true));

    // Add the new stock to the selected stocks list.
    this.selectedStocks.set([...stocks, {
      name: stock.name,
      symbol: stock.symbol,
      shares: [this.createEmptyShare()],
      isRising: null,
      price: null,
      change: null,
      changePercent: null,
      priceHistory: [],
      company: {
        Symbol: null,
        Description: null,
        Name: null,
        PERatio: null,
        Exchange: null,
        Sector: null,
        Industry: null,
        AssetType: null,
      },
      news: [],
      isCollapsed: false,
      updateChart: false,
    }]);

    // Load data for the newly added stock.
    this.getPriceHistory(stock.symbol);
    this.getCurrentPrice(stock.symbol);
    this.getCompanyData(stock.symbol);
    this.getStockNews(stock.symbol);
  }

  // Determine whether the net equity chart should be rendered.
  displayNetChart(): void {
    if (this.selectedStocks().length === 0) {
      return;
    }

    const stocks = structuredClone(this.selectedStocks());

    // For each stock, keep only valid, complete shares.
    stocks.forEach(
      (stock) =>
        (stock.shares = stock.shares.filter(
          (share) =>
            !share.dateError &&
            !share.numberError &&
            !share.priceError &&
            share.date &&
            share.number &&
            (share.price || share.price === 0),
        )),
    );

    // There must be at least one stock with price history and a share.
    const enoughData = stocks.some((stock) => stock.priceHistory.length > 1 && stock.shares.length > 0);

    if (enoughData && this.renderNetChart) {
      // Update the chart if it is already rendered.
      this.updateNetChart = true;
    } else if (enoughData) {
      // Render the chart for the first time.
      this.renderNetChart = true;
    } else {
      // Otherwise, do not render the chart.
      this.renderNetChart = false;
    }
  }

  /* Immutably replace a stock and render immediately. Some async sources
  resolve outside Angular, so marking signal consumers dirty is not enough to
  run change detection until the next browser event. */
  private patchStock(symbol: string, changes: Partial<Stock>): void {
    const stocks = this.selectedStocks();
    const index = stocks.findIndex((stock) => stock.symbol === symbol);
    if (index === -1) {
      return;
    }

    const updated = [...stocks];
    updated[index] = { ...stocks[index], ...changes };
    this.selectedStocks.set(updated);

    if (!this.destroyRef.destroyed) {
      this.changeDetector.detectChanges();
    }
  }

  // Get information about the specified stock's company.
  getCompanyData(symbol: string): void {
    this.stockService.getCompanyData(symbol).subscribe((data) => {
      this.patchStock(symbol, { company: data });

      // Scroll to the selected stock.
      document.getElementById(symbol)?.scrollIntoView();
    });
  }

  // Get the current price for the specified stock.
  getCurrentPrice(symbol: string): void {
    this.stockService.getCurrentPrice(symbol).subscribe((data) => {
      this.patchStock(symbol, { price: data.c, change: data.d, changePercent: data.dp });
    });
  }

  // Get the price history for the specified stock.
  getPriceHistory(symbol: string): void {
    this.stockService.getDailyData(symbol).subscribe((data) => {
      const stock = this.selectedStocks().find((s) => s.symbol === symbol);
      if (!stock) {
        return;
      }
      const series = data['Time Series (Daily)'];

      if (series) {
        // Format the daily data and order it from oldest to newest date.
        const apiData = Object.keys(series)
          .map((date) => ({
            // Set the date time to 12:00 AM EST.
            date: new Date(`${date.replace(/-/g, '/')} 00:00 GMT-4`),
            close: parseFloat(series[date]['4. close']),
            volume: parseFloat(series[date]['5. volume']),
            dividend: 0,
          }))
          .reverse();

        // Determine whether the price is rising vs. the previous day's close.
        const isRising = (stock.price ?? 0) > apiData[apiData.length - 1].close;

        this.patchStock(symbol, { priceHistory: apiData, isRising, updateChart: true });

        // Cache the history so it can be reloaded if the API rate-limits us.
        sessionStorage.setItem(symbol, JSON.stringify(apiData));
      } else {
        // The API limited us; fall back to cached data when available.
        const cached = sessionStorage.getItem(symbol);
        if (cached) {
          const priceHistory = (JSON.parse(cached) as Array<Record<string, unknown>>).map((point) => ({
            date: new Date(point['date'] as string),
            close: point['close'] as number,
            volume: point['volume'] as number,
            dividend: point['dividend'] as number,
          }));
          const isRising = (stock.price ?? 0) > priceHistory[priceHistory.length - 2].close;
          this.patchStock(symbol, { priceHistory, isRising, updateChart: true });
        }
      }
    });
  }

  // Get the latest news for the specified stock.
  getStockNews(symbol: string): void {
    this.stockService.getStockNews(symbol).subscribe((data) => {
      if (data.length) {
        const news: Article[] = data.slice(0, 10).map((raw) => ({
          ...raw,
          // The raw API value is a comma-delimited string; keep only known symbols.
          related: raw.related.split(',').filter((item) => this.symbols.includes(item)),
        }));

        this.patchStock(symbol, { news });

        // Cache the news so it can be reloaded if the API rate-limits us.
        sessionStorage.setItem(`${symbol}-news`, JSON.stringify(news));
      } else {
        const cached = sessionStorage.getItem(`${symbol}-news`);
        this.patchStock(symbol, { news: cached ? (JSON.parse(cached) as Article[]) : [] });
      }
    });
  }

  // Reset the update flag after the net equity chart has been updated.
  onNetChartUpdated(): void {
    this.updateNetChart = false;
  }

  // Reset the update flag for a stock after its price chart has been updated.
  // Runs during the chart's lifecycle (inside change detection), so this resets
  // the (non-template-bound) flag directly rather than triggering another pass.
  onPriceChartUpdated(symbol: string): void {
    const stocks = this.selectedStocks();
    const index = stocks.findIndex((stock) => stock.symbol === symbol);
    if (index !== -1) {
      stocks[index].updateChart = false;
    }
  }

  // Remove a share from the specified stock.
  removeShare(removal: { symbol: string; index: number }): void {
    const stocks = this.selectedStocks();
    const stockIndex = stocks.findIndex((obj) => obj.symbol === removal.symbol);
    const numberOfShares = stocks[stockIndex].shares.length;

    stocks[stockIndex].shares.splice(removal.index, 1);
    this.selectedStocks.set([...stocks]);

    // If the removed share was the last one, add an empty share back.
    if (removal.index === numberOfShares - 1) {
      this.addNewShare(removal.symbol);
    } else {
      this.displayNetChart();
    }
  }

  // Remove the specified stock from the user's portfolio.
  removeStock(stock: Stock): void {
    this.selectedStocks.update((stocks) => stocks.filter((obj) => obj.symbol !== stock.symbol));
    this.displayNetChart();
  }

  private createEmptyShare(): Share {
    return {
      date: null,
      dateError: null,
      number: null,
      numberError: null,
      price: null,
      priceError: null,
    };
  }
}
