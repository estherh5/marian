import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private alphaUrl = 'https://www.alphavantage.co/query';

  private iexUrl = 'https://cloud.iexapis.com/v1';

  constructor(private http: HttpClient) { }

  // Get information about the specified stock's company
  getCompanyData(symbol: string): Observable<any> {
    const url = `${this.iexUrl}/stock/${symbol}/company?token=` +
      `${environment.iexPublicKey}`;
    return this.http.get(url);
  }

  // Get the current price for the specified stock
  getCurrentPrice(symbol: string): Observable<any> {
    const url = `${this.iexUrl}/stock/${symbol}/quote?token=` +
      `${environment.iexPublicKey}&displayPercent=true`;
    return this.http.get(url);
  }

  // Get daily price data for specified stock's full history (up to 20 years)
  getDailyData(symbol: string): Observable<any> {
    const url = `${this.alphaUrl}?function=TIME_SERIES_DAILY_ADJUSTED` +
      `&symbol=${symbol}&outputsize=full&apikey=${environment.alphaPublicKey}`;

    return this.http.get(url);
  }

  // Get the last minute's price data for specified stock
  getLastMinuteData(symbol: string): Observable<any> {
    const url = `${this.iexUrl}/stock/${symbol}/intraday-prices?token=` +
      `${environment.iexPublicKey}&chartLast=1`;
    return this.http.get(url);
  }

  // Get the latest news for the specified stock
  getStockNews(symbol: string): Observable<any> {
    const url = `${this.iexUrl}/stock/${symbol}/news?token=` +
      `${environment.iexPublicKey}`;
    return this.http.get(url);
  }

  // Get URL for stock article thumbnail image
  getStockNewsImage(symbol: string, articleId: string): Observable<any> {
    const url = `https://pause-app-api.herokuapp.com/api/marian/image/` +
      `${symbol}/${articleId}`;

  // Get today's price data for specified stock, per minute
  getTodayData(symbol: string): Observable<any> {
    const url = `${this.iexUrl}/stock/${symbol}/intraday-prices?token=` +
      `${environment.iexPublicKey}`;
    return this.http.get(url);
  }
}
