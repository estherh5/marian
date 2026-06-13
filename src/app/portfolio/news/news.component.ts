import { Component, input, output } from '@angular/core';

import { Article } from '../../article';
import { StockSelection } from '../../stock';
import { STOCKS } from '../../stocks';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
})
export class NewsComponent {
  readonly news = input.required<Article[]>();

  readonly stockSelected = output<StockSelection>();

  private readonly stocks = STOCKS;

  /* Convert an article's published time (UNIX timestamp) to a number of
  minutes/hours/days ago. */
  toTimeAgo(unix: number): string {
    const now = new Date().getTime();
    const articleTime = new Date(unix * 1000).getTime();

    // Get difference between now and article's published time in hours.
    const difference = (now - articleTime) / (1000 * 3600);

    // Return minutes if difference is less than 1 hour.
    if (difference < 1) {
      const minutes = Math.round(difference * 60);
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }

    // Return hours if difference is less than 24 hours.
    if (difference < 24) {
      const hours = Math.round(difference);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }

    // Return days otherwise.
    const days = Math.round(difference / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  // Emit a stock selected event when a related stock is selected for an article.
  selectStock(symbol: string): void {
    // Get the selected stock's name to pass in the stock selected event.
    const name = this.stocks.find((stock) => stock.symbol === symbol)?.name ?? symbol;
    this.stockSelected.emit({ symbol, name });
  }
}
