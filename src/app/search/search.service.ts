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
    const url = `${this.searchUrl}?company=${phrase}&key=U5AK5G3PLM6XWIT2NZDP`;
    return this.http.get<Stock[]>(url);
  }
}
