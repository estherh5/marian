import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

import { ShareRemoval } from '../share';
import { Stock, StockSelection } from '../stock';
import { CalculatorComponent } from './calculator/calculator.component';
import { ChartComponent } from './chart/chart.component';
import { CompanyComponent } from './company/company.component';
import { NewsComponent } from './news/news.component';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
  imports: [NgClass, CalculatorComponent, ChartComponent, CompanyComponent, NewsComponent],
})
export class PortfolioComponent {
  readonly selectedStock = input.required<Stock>();

  readonly chartUpdated = output<string>();
  readonly shareEntered = output<string>();
  readonly shareRemoved = output<ShareRemoval>();
  readonly stockRemoved = output<Stock>();
  readonly stockSelected = output<StockSelection>();

  // Exposed so the template can format price changes.
  readonly Math = Math;

  // Emit a chart-updated event when the child chart component is updated.
  onChartUpdated(symbol: string): void {
    this.chartUpdated.emit(symbol);
  }

  // Emit a share-entered event when a share is added/updated in the calculator.
  onShareEntered(symbol: string): void {
    this.shareEntered.emit(symbol);
  }

  // Emit a share-removed event when a share is removed in the calculator.
  onShareRemoved(removal: ShareRemoval): void {
    this.shareRemoved.emit(removal);
  }

  // Emit a stock-selected event when a related stock is selected in the news.
  onStockSelected(stock: StockSelection): void {
    this.stockSelected.emit(stock);
  }

  // Emit a stock-removed event when the remove-stock button is clicked.
  removeStock(stock: Stock): void {
    this.stockRemoved.emit(stock);
  }
}
