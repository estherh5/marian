import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { Company } from '../company';
import { Stock } from '../stock';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  @Input() selectedStock: Stock;

  @Output() chartUpdated: EventEmitter<string> = new EventEmitter<string>();
  @Output() shareEntered: EventEmitter<string> = new EventEmitter<string>();
  @Output() shareRemoved: EventEmitter<any> = new EventEmitter<any>();
  @Output() stockRemoved: EventEmitter<Stock> = new EventEmitter<Stock>();
  @Output() stockSelected: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void { }

  // Emit chart updated event when child chart component is updated
  onChartUpdated(symbol: string): void {
    return this.chartUpdated.emit(symbol);
  }

  /* Emit share entered event when share is added or updated in child
  calculator component */
  onShareEntered(symbol: string): void {
    return this.shareEntered.emit(symbol);
  }

  /* Emit share removed event when share is removed in child calculator
  component */
  onShareRemoved(stock: any): void {
    return this.shareRemoved.emit(stock);
  }

  // Emit stock selected event when stock is selected in child search component
  onStockSelected(stock: any): void {
    return this.stockSelected.emit(stock);
  }

  // Emit stock removed event when remove stock button is clicked
  removeStock(stock: Stock): void {
    return this.stockRemoved.emit(stock);
  }
}
