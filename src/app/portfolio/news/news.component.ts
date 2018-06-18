import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { Article } from '../../article';
import { STOCKS } from '../../stocks';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {
  @Input() news: Article[];

  @Output() stockSelected: EventEmitter<any> = new EventEmitter<any>();

  stocks: Array<any> = STOCKS;

  constructor() { }

  ngOnInit(): void { }

  /* Convert article's published time (ISO string) to number of
  minutes/hours/days ago */
  toTimeAgo(iso: string): string {
    const now = new Date().getTime();
    const articleTime = new Date(iso).getTime();

    // Get difference between now and article's published time in hours
    const difference = (now - articleTime)/(1000 * 3600);

    // Return minutes if difference is less than 1 hour
    if (difference < 1) {
      let minutes = Math.round(difference * 60);

      if (minutes === 1) {
        return '1 minute ago';
      }

      return minutes.toString() + ' minutes ago';
    }

    // Return hours if difference is less than 24 hours
    if (difference < 24) {
      let hours = Math.round(difference);

      if (hours === 1) {
        return '1 hour ago';
      }

      return hours.toString() + ' hours ago';
    }

    // Return days otherwise
    let days = Math.round(difference / 24);

    if (days === 1) {
      return '1 day ago';
    }

    return Math.round(days).toString() + ' days ago';
  }

  // Emit stock selected event when related stock is selected for article
  selectStock(symbol: string): void {
    // Get selected stock's name to pass in stock selected event
    let name = this.stocks.find(stock => stock.symbol === symbol).name;

    let stock = {
      symbol: symbol,
      name: name
    }

    return this.stockSelected.emit(stock);
  }
}
