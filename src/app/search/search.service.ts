import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Stock } from '../stock';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchUrl = 'https://www.tickerapi.com/lookup.php';

  constructor(private http: HttpClient) { }

  getStocks (phrase: string): Observable<Stock[]> {
    const url = `${this.searchUrl}?company=${phrase}&key=REDACTED`;
    return this.http.get<Stock[]>(url);
  }
}
