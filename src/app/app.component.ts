import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { interval } from 'rxjs';

import { Article } from './article';
import { Share } from './share';
import { LoadState, Stock, StockPart, StockSelection } from './stock';
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

  // The stock removed last, kept for a few seconds so its removal can be undone.
  readonly removed = signal<{ stock: Stock; index: number } | null>(null);
  private undoTimer: ReturnType<typeof setTimeout> | undefined;

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
      company: {},
      news: [],
      load: { quote: 'loading', history: 'loading', company: 'loading', news: 'loading' },
      isCollapsed: false,
      updateChart: false,
    }]);

    // Bring the new card into view now; its sections fill in as data arrives.
    this.changeDetector.detectChanges();
    document.getElementById(stock.symbol)?.scrollIntoView();

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
    this.stockService.getCompanyData(symbol).subscribe({
      next: (data) => {
        // A fund or an unknown symbol has no profile: Finnhub answers `{}`.
        // A notice in place of data (a limit, a bad key) is a failure.
        const notice = data && ['error', 'Information', 'Note'].some((key) => key in data);
        if (notice) {
          this.setLoad(symbol, 'company', 'error');
        } else {
          this.patchStock(symbol, { company: data ?? {} });
          this.setLoad(symbol, 'company', 'ready');
        }
      },
      error: () => this.setLoad(symbol, 'company', 'error'),
    });
  }

  // Get the current price for the specified stock.
  getCurrentPrice(symbol: string): void {
    this.stockService.getCurrentPrice(symbol).subscribe({
      next: (data) => {
        // The quote's own change gives the day's direction. Alpha Vantage's daily
        // series already holds today's close, so comparing against it can't.
        // Finnhub sends a null change for a symbol it doesn't know.
        const isRising = typeof data.d === 'number' ? data.d >= 0 : null;
        this.patchStock(symbol, { price: data.c, change: data.d, changePercent: data.dp, isRising });
        this.setLoad(symbol, 'quote', 'ready');
      },
      // A failed minute refresh keeps the last price on screen.
      error: () => {
        if (this.selectedStocks().find((s) => s.symbol === symbol)?.price == null) {
          this.setLoad(symbol, 'quote', 'error');
        }
      },
    });
  }

  // Get the price history for the specified stock.
  getPriceHistory(symbol: string): void {
    this.stockService.getDailyData(symbol).subscribe({
      next: (data) => this.onPriceHistory(symbol, data['Time Series (Daily)']),
      error: () => this.onPriceHistory(symbol, undefined),
    });
  }

  private onPriceHistory(symbol: string, series: Record<string, Record<string, string>> | undefined): void {
    if (!this.selectedStocks().some((s) => s.symbol === symbol)) {
      return;
    }

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

      this.patchStock(symbol, { priceHistory: apiData, updateChart: true });
      this.setLoad(symbol, 'history', 'ready');

      // Cache the history so it can be reloaded if the API rate-limits us.
      sessionStorage.setItem(symbol, JSON.stringify(apiData));
    } else {
      // The API limited us or failed; fall back to cached data when available.
      const cached = sessionStorage.getItem(symbol);
      if (cached) {
        const priceHistory = (JSON.parse(cached) as Array<Record<string, unknown>>).map((point) => ({
          date: new Date(point['date'] as string),
          close: point['close'] as number,
          volume: point['volume'] as number,
          dividend: point['dividend'] as number,
        }));
        this.patchStock(symbol, { priceHistory, updateChart: true });
        this.setLoad(symbol, 'history', 'ready');
      } else {
        this.setLoad(symbol, 'history', 'error');
      }
    }
  }

  // Get the latest news for the specified stock.
  getStockNews(symbol: string): void {
    const fallBack = (): void => {
      const cached = sessionStorage.getItem(`${symbol}-news`);
      if (cached) {
        this.patchStock(symbol, { news: JSON.parse(cached) as Article[] });
        this.setLoad(symbol, 'news', 'ready');
      } else {
        this.setLoad(symbol, 'news', 'error');
      }
    };

    this.stockService.getStockNews(symbol).subscribe({
      error: fallBack,
      next: (data) => {
        if (!Array.isArray(data)) {
          fallBack();
        } else if (data.length) {
          const news: Article[] = data.slice(0, 10).map((raw) => ({
            ...raw,
            // The raw API value is a comma-delimited string; keep only known symbols.
            related: raw.related.split(',').filter((item) => this.symbols.includes(item)),
          }));

          this.patchStock(symbol, { news });
          this.setLoad(symbol, 'news', 'ready');

          // Cache the news so it can be reloaded if the API rate-limits us.
          sessionStorage.setItem(`${symbol}-news`, JSON.stringify(news));
        } else {
          // No news in the past year is an answer, not a failure.
          this.patchStock(symbol, { news: [] });
          this.setLoad(symbol, 'news', 'ready');
        }
      },
    });
  }

  // Record where one of a stock's requests stands.
  private setLoad(symbol: string, part: StockPart, state: LoadState): void {
    const stock = this.selectedStocks().find((s) => s.symbol === symbol);
    if (stock) {
      this.patchStock(symbol, { load: { ...stock.load, [part]: state } });
    }
  }

  // Request one part of a stock's card again after it failed.
  retry({ symbol, part }: { symbol: string; part: StockPart }): void {
    this.setLoad(symbol, part, 'loading');
    const load = {
      quote: () => this.getCurrentPrice(symbol),
      history: () => this.getPriceHistory(symbol),
      company: () => this.getCompanyData(symbol),
      news: () => this.getStockNews(symbol),
    };
    load[part]();
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
    const index = this.selectedStocks().findIndex((obj) => obj.symbol === stock.symbol);
    this.selectedStocks.update((stocks) => stocks.filter((obj) => obj.symbol !== stock.symbol));
    this.displayNetChart();

    // With nothing left, go back to the landing page and its search.
    if (this.selectedStocks().length === 0) {
      this.renderNetChart = false;
      this.isLandingPage = true;
      this.changeDetector.detectChanges();
      document.querySelector<HTMLInputElement>('.search-bar')?.focus();
    }

    // Offer an undo: the card may hold shares the user typed in.
    clearTimeout(this.undoTimer);
    this.removed.set({ stock, index });
    this.undoTimer = setTimeout(() => this.removed.set(null), 8000);
  }

  // Put the last removed stock back where it was.
  undoRemove(): void {
    const removed = this.removed();
    if (!removed) {
      return;
    }
    clearTimeout(this.undoTimer);
    this.removed.set(null);
    this.isLandingPage = false;
    this.selectedStocks.update((stocks) => {
      const next = [...stocks];
      next.splice(removed.index, 0, { ...removed.stock, updateChart: true });
      return next;
    });
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
