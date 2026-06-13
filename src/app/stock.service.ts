import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Company } from './company';

/** Finnhub real-time quote response. */
export interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // change percent
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

/** Finnhub company-news article (raw shape). */
export interface FinnhubArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

/** Alpha Vantage TIME_SERIES_DAILY response (only the parts we read). */
export interface AlphaVantageDailyResponse {
  'Time Series (Daily)'?: Record<string, Record<string, string>>;
  Note?: string;
  Information?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly http = inject(HttpClient);

  // All upstream calls go through serverless proxy functions so the Alpha
  // Vantage and Finnhub API keys stay server-side (see netlify/functions/*).
  private readonly apiUrl = '/api';

  // Get information about the specified stock's company.
  getCompanyData(symbol: string): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/company`, {
      params: new HttpParams().set('symbol', symbol),
    });
  }

  // Get the current price for the specified stock.
  getCurrentPrice(symbol: string): Observable<FinnhubQuote> {
    return this.http.get<FinnhubQuote>(`${this.apiUrl}/quote`, {
      params: new HttpParams().set('symbol', symbol),
    });
  }

  // Get daily price data for the specified stock (free-tier: latest 100 days).
  getDailyData(symbol: string): Observable<AlphaVantageDailyResponse> {
    return this.http.get<AlphaVantageDailyResponse>(`${this.apiUrl}/daily`, {
      params: new HttpParams().set('symbol', symbol),
    });
  }

  // Get the latest year of news for the specified stock.
  getStockNews(symbol: string): Observable<FinnhubArticle[]> {
    return this.http.get<FinnhubArticle[]>(`${this.apiUrl}/news`, {
      params: new HttpParams().set('symbol', symbol),
    });
  }
}
