import { Component, OnInit, Input, Output, ViewChild, ElementRef,
  EventEmitter } from '@angular/core';

import { Share } from '../../share';
import { Stock } from '../../stock';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})
export class CalculatorComponent implements OnInit {
  @Input() selectedStock: Stock;

  @Output() shareEntered: EventEmitter<string> = new EventEmitter<string>();
  @Output() shareRemoved: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void { }

  /* Validate input fields for share based on passed type ('date', 'number',
  'price') and event (input value) */
  inputChanged(share: Share, type: string, event: any): void {
    /* If input is date type, remove any previous error and determine if
    purchase date is before the latest market close time */
    if (type === 'date') {
      share.dateError = '';

      if (new Date(`${event.replace(/-/g, '/')} 09:30 GMT-` +
        `${new Date().getTimezoneOffset()/60}`).getTime() >
        this.selectedStock.priceHistory[this.selectedStock
        .priceHistory.length - 1].date.getTime()) {
          share.dateError = 'Purchase date must be before the latest market ' +
            'close.';
        }

        // Otherwise, set share date as input value
        else {
          share.date = event.replace(/-/g, '/');
        }
    }

    /* If input is number type, remove any previous error and determine if
    share number is greater than 0 */
    else if (type === 'number') {
      share.numberError = '';

      if (event <= 0) {
        share.numberError = 'Number of shares must be greater than 0.';
      }

      // Otherwise, set share number as input value
      else {
        share.number = event;
      }
    }

    /* If input is price type, remove any previous error and determine if
    share price is greater than 0 */
    else if (type === 'price') {
      share.priceError = '';

      if (event < 0) {
        share.priceError = 'Price per share cannot be negative.';
      }

      // Otherwise, set share price as input value
      else {
        share.price = event;
      }
    }

    return;
  }

  /* Emit remove share event with index of specifed share to remove when remove
  share button is clicked */
  removeShare(symbol: string, index: string): void {
    return this.shareRemoved.emit({symbol: symbol, index: index});
  }

  /* Format share price as two decimal places to represent currency when user
  focuses out of price input */
  formatPrice(share: Share): void {
    share.price = share.price.toFixed(2);
    return;
  }

  /* Emit share entered event with specified stock's symbol when each input of
  share is specified and user focuses out of input */
  onShareEntered(index: string): void {
    // Get each input for the given share index
    let dateInput = <HTMLInputElement>document.getElementById(this
      .selectedStock.symbol + 'dateInput' + index);
    let numberInput = <HTMLInputElement>document.getElementById(this
      .selectedStock.symbol + 'numberInput' + index);
    let priceInput = <HTMLInputElement>document.getElementById(this
      .selectedStock.symbol + 'priceInput' + index);

    // Emit share entered event if each input value is specified
    if (dateInput.value && parseFloat(numberInput.value) > 0 &&
      parseFloat(priceInput.value) >= 0) {
        this.shareEntered.emit(this.selectedStock.symbol);
      }

    return;
  }
}
