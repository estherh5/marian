import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private alphaUrl = 'https://www.alphavantage.co/query';

  private finnHubUrl = 'https://finnhub.io/api/v1';

  constructor(private http: HttpClient) { }

  // Get information about the specified stock's company
  getCompanyData(symbol: string): Observable<any> {
    const url = `${this.alphaUrl}?function=OVERVIEW&symbol=${symbol}&apikey=` +
      `${environment.alphaPublicKey}`;
    return this.http.get(url);
  }

  // Get the current price for the specified stock
  getCurrentPrice(symbol: string): Observable<any> {
    const url = `${this.finnHubUrl}/quote?symbol=${symbol}&token=` +
      `${environment.finnHubPublicKey}`;
    return this.http.get(url);
  }

  // Get the earnings for the specified stock
  getEarnings(symbol: string): Observable<any> {
    const url = `${this.finnHubUrl}/calendar/earnings?symbol=${symbol}&token=` +
      `${environment.finnHubPublicKey}`;
    return this.http.get(url);
  }

  // Get daily price data for specified stock's full history (up to 20 years)
  getDailyData(symbol: string): Observable<any> {
    const url = `${this.alphaUrl}?function=TIME_SERIES_DAILY` +
      `&symbol=${symbol}&outputsize=full&apikey=${environment.alphaPublicKey}`;
    return this.http.get(url);
  }

  // Get the latest news for the specified stock
  getStockNews(symbol: string): Observable<any> {
    const fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]
    const toDate = new Date().toISOString().split('T')[0];
    const url = `${this.finnHubUrl}/company-news?symbol=${symbol}` +
      `&from=${fromDate}&to=${toDate}&token=${environment.finnHubPublicKey}`;
    return this.http.get(url);
  }
}
