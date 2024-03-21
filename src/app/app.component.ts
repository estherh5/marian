import { Component } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';
import * as moment from 'moment';
import { interval } from 'rxjs';

import { environment } from '../environments/environment';

import { Company } from './company';
import { PriceData } from './pricedata';
import { Share } from './share';
import { Stock } from './stock';
import { StockService } from './stock.service';
import { SYMBOLS } from './symbols';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Set refresh interval to 1 minute to get latest stock price
  private refreshInterval$ = interval(60000);

  // Stores whether user is on the landing page or not
  isLandingPage: boolean = true;

  // Stores whether or not the net equity chart should be rendered
  renderNetChart: boolean = false;

  // List of stocks in user's portfolio
  selectedStocks: Stock[] = [];

  // Array of stock symbols
  symbols: Array<string> = SYMBOLS;

  // Stores whether or not the net equity chart should be updated
  updateNetChart: boolean;

  constructor(private stockService: StockService) { }

  ngOnInit(): void {
    /* If today is not Saturday or Sunday and the time is not before market
    open (9:30 AM EST) or after market close (4:00 PM EST), request latest
    stock price every minute */
    if (![0, 6].includes(new Date().getDay()) &&
      moment().utcOffset(-240).hours() +
      moment().utcOffset(-240).minutes()/60 >= 9.5 &&
      moment().utcOffset(-240).hours() < 16) {
        this.refreshInterval$.subscribe(() => {

          /* If user has selected stocks in portfolio, update stock price for
          each */
          if (this.selectedStocks) {
            this.selectedStocks.map(stock => {

              /* Get latest stock price only if historical stock data has
              already been acquired */
              if (stock.priceHistory) {
                this.getCurrentPrice(stock.symbol);
              }

            });
          }

        });
      }

    return;
  }

  /* Add empty share to specified stock's shares list so user can enter another
  share for stock */
  addNewShare(symbol: string): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(stock => stock.symbol === symbol);

    // Check if specified stock already contains empty share
    let includesEmpty = this.selectedStocks[stockIndex].shares
      .some(share => share.date === null);

    /* Add empty share to specified stock's shares list if it is not already
    there */
    if (!includesEmpty) {
      this.selectedStocks[stockIndex].shares.push(<Share>({
        date: null,
        dateError: null,
        number: null,
        numberError: null,
        price: null,
        priceError: null
      }));
    }

    // Re-render net equity chart
    return this.displayNetChart();
  }

  // Add new stock to selected stocks list
  addNewStock(stock: any): void {
    // If stock is already in portfolio, scroll to stock
    if (this.selectedStocks.find(obj => obj.symbol === stock.symbol)) {
      return document.getElementById(stock.symbol).scrollIntoView();
    }

    // Change view to portfolio instead of landing page
    this.isLandingPage = false;

    // Collapse all previously added stocks in portfolio
    this.selectedStocks.map(obj => obj.isCollapsed = true);

    // Add new stock to selected stocks list
    this.selectedStocks.push(<Stock>({
      name: stock.name,
      symbol: stock.symbol,
      shares: [
        {
          date: null,
          dateError: null,
          number: null,
          numberError: null,
          price: null,
          priceError: null
        }
      ],
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
      updateChart: false
    }));

    // Get data for newly added stock
    this.getPriceHistory(stock.symbol);
    this.getCurrentPrice(stock.symbol);
    this.getCompanyData(stock.symbol);
    this.getStockNews(stock.symbol);

    return;
  }

  // Determine if net equity chart should be rendered
  displayNetChart(): void {
    /* If user has at least one stock selected in portfolio, determine if there
    is enough shares data to render net equity chart */
    if (this.selectedStocks.length > 0) {
      let stocks = cloneDeep(this.selectedStocks);

      /* For each stock, filter the shares list to only contain shares without
      errors and with date, number and price */
      stocks.map(stock => stock.shares = stock.shares
        .filter(share => !share.dateError && !share.numberError &&
          !share.priceError && share.date && share.number &&
          (share.price || share.price === 0)
        )
      );

      /* Check that at least one stock has historical price data and at least
      one share */
      let enoughData = stocks.some(stock => stock.priceHistory.length > 1 &&
        stock.shares.length > 0);

      /* Update net equity chart if there is enough data and it was already
      initially rendered */
      if (enoughData && this.renderNetChart) {
        this.updateNetChart = true;
      }

      /* Render net equity chart if there is enough data and it was not already
      rendered */
      else if (enoughData) {
        this.renderNetChart = true;
      }

      // Otherwise, do not render net equity chart
      else {
        this.renderNetChart = false;
      }
    }

    return;
  }

  // Get information about specified stock's company
  getCompanyData(symbol: string): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(stock => stock.symbol === symbol);

    this.stockService.getCompanyData(symbol).subscribe(data => {
      this.selectedStocks[stockIndex].company = data;

      // Scroll to selected stock
      document.getElementById(symbol).scrollIntoView();
    });

    return;
  }

  // Get current price for specified stock
  getCurrentPrice(symbol: string): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(stock => stock.symbol === symbol);

    /* Store latest price and change (in $ and %) */
    this.stockService.getCurrentPrice(symbol).subscribe(data => {
      this.selectedStocks[stockIndex].price = data.c;
      this.selectedStocks[stockIndex].change = data.d;
      this.selectedStocks[stockIndex].changePercent = data.dp;
    });

    return;
  }

  // Get price history for specified stock
  getPriceHistory(symbol: string): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(stock => stock.symbol === symbol);

    // Get daily price history
    this.stockService.getDailyData(symbol).subscribe(data => {

      // If service returns daily time series data, add it to selected stock
      if (data['Time Series (Daily)']) {
        /* Format date, close, volume, and dividend data from service, and
        order data from oldest to newest date */
        let apiData = Object.keys(data['Time Series (Daily)'])
          .map(date => ({
            // Set date time to 12:00 AM EST
            date: new Date(`${date.replace(/-/g, '/')} 00:00 GMT-4`),

            close: parseFloat(data['Time Series (Daily)'][date]['4. close']),

            volume: parseFloat(data['Time Series (Daily)'][date]
              ['5. volume']),

            dividend: 0
          })).reverse();

        /* Determine if stock price is rising by comparing current price to
        previous day's market close price */
        this.selectedStocks[stockIndex].isRising = this.selectedStocks[stockIndex].price > apiData[apiData.length - 1].close;

        // Set stock data for specified stock
        this.selectedStocks[stockIndex].priceHistory = apiData;

        // Trigger update of specified stock's price chart
        this.selectedStocks[stockIndex].updateChart = true;
        
        // Store stock data in session storage for loading if server errors
        sessionStorage.setItem(symbol, JSON.stringify(this
          .selectedStocks[stockIndex].priceHistory));
      }

      /* If service sends error that maximum number of requests have been made,
      use session stored data for stock if available */
      else {
        if (sessionStorage.getItem(symbol)) {
          this.selectedStocks[stockIndex].priceHistory = JSON.parse(sessionStorage.getItem(symbol))
            .map(stock => ({
              date: new Date(stock['date']),
              close: stock['close'],
              volume: stock['volume'],
              dividend: stock['dividend']
            }));
        }

        /* Determine if stock price is rising by comparing current price to
        previous day's market close price */
        if (sessionStorage.getItem(symbol)) {
          this.selectedStocks[stockIndex].isRising = this.selectedStocks[stockIndex].price > this
            .selectedStocks[stockIndex].priceHistory[this
            .selectedStocks[stockIndex].priceHistory.length - 2].close;
        }
      }
    });

    return;
  }

  // Get latest news for specified stock
  getStockNews(symbol: string): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(stock => stock.symbol === symbol);

    this.stockService.getStockNews(symbol).subscribe(data => {
      if (data.length) {
        data.slice(0, 10).map(article => {
          /* Set related stocks list to an array and filter out symbols that are
          not in the stock search array */
          article.related = article.related.split().filter(item => this.symbols
            .includes(item));

          this.selectedStocks[stockIndex].news.push(article);
        });

        // Store stock news in session storage for loading if server errors
        sessionStorage.setItem(`${symbol}-news`, JSON.stringify(this
          .selectedStocks[stockIndex].news));
      }
      
      /* If service sends error that maximum number of requests have been made,
      use session stored data for news if available */
      else if (sessionStorage.getItem(`${symbol}-news`)) {
          this.selectedStocks[stockIndex].news = JSON.parse(sessionStorage.getItem(`${symbol}-news`));
      } else {
        this.selectedStocks[stockIndex].news = [];
      }
      return;
    });
  }

  // Reset update net chart value after net equity chart has been updated
  onNetChartUpdated(): void {
    this.updateNetChart = false;

    return;
  }

  /* Reset update chart item for specified stock after its price chart has been
  updated */
  onPriceChartUpdated(symbol: string): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(stock => stock.symbol === symbol);

    this.selectedStocks[stockIndex].updateChart = false;

    return;
  }

  // Remove share from specified stock
  removeShare(stock: any): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(obj => obj.symbol === stock.symbol);

    let numberOfShares = this.selectedStocks[stockIndex].shares.length;

    // Remove share at specified index
    this.selectedStocks[stockIndex].shares.splice(stock.index, 1);

    /* If removed share was the last share in the shares list for the stock,
    add an empty share */
    if (parseInt(stock.index) === numberOfShares - 1) {
      return this.addNewShare(stock.symbol);
    }

    // Otherwise, re-render net equity chart
    else {
      return this.displayNetChart();
    }
  }

  // Remove specified stock from user's portfolio
  removeStock(stock: Stock): void {
    // Find index of specified stock in selected stocks list
    let stockIndex = this.selectedStocks
      .findIndex(obj => obj.symbol === stock.symbol);

    // Remove stock from selected stocks list
    this.selectedStocks.splice(stockIndex, 1);

    // Determine if net equity chart should be displayed anymore
    return this.displayNetChart();
  }
}
