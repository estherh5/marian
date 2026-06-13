import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

import { Share, ShareRemoval } from '../../share';
import { Stock } from '../../stock';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css'],
  imports: [FormsModule, NgClass],
})
export class CalculatorComponent {
  readonly selectedStock = input.required<Stock>();

  readonly shareEntered = output<string>();
  readonly shareRemoved = output<ShareRemoval>();

  /* Validate input fields for a share based on the passed type ('date',
  'number', 'price') and event (input value). */
  inputChanged(share: Share, type: 'date' | 'number' | 'price', event: string | number): void {
    const stock = this.selectedStock();

    // If input is a date, determine if the purchase date is before the latest
    // market close time.
    if (type === 'date') {
      const value = String(event);
      share.dateError = '';

      const latestClose = stock.priceHistory[stock.priceHistory.length - 1].date.getTime();
      const offsetHours = new Date().getTimezoneOffset() / 60;
      const purchaseDate = new Date(`${value.replace(/-/g, '/')} 09:30 GMT-${offsetHours}`).getTime();

      if (purchaseDate > latestClose) {
        share.dateError = 'Purchase date must be before the latest market close.';
      } else {
        share.date = value.replace(/-/g, '/');
      }
      return;
    }

    // If input is a share count, ensure it is greater than 0.
    if (type === 'number') {
      const value = Number(event);
      share.numberError = '';

      if (value <= 0) {
        share.numberError = 'Number of shares must be greater than 0.';
      } else {
        share.number = value;
      }
      return;
    }

    // If input is a price, ensure it is not negative.
    const value = Number(event);
    share.priceError = '';

    if (value < 0) {
      share.priceError = 'Price per share cannot be negative.';
    } else {
      share.price = value;
    }
  }

  /* Emit a remove-share event with the index of the share to remove when the
  remove-share button is clicked. */
  removeShare(symbol: string, index: number): void {
    this.shareRemoved.emit({ symbol, index });
  }

  /* Format share price to two decimal places when the user focuses out of the
  price input. */
  formatPrice(share: Share): void {
    if (share.price != null) {
      share.price = Number(share.price.toFixed(2));
    }
  }

  /* Emit a share-entered event with the stock's symbol once every input of a
  share is specified and the user focuses out of an input. */
  onShareEntered(index: number): void {
    const symbol = this.selectedStock().symbol;
    const dateInput = document.getElementById(`${symbol}dateInput${index}`) as HTMLInputElement;
    const numberInput = document.getElementById(`${symbol}numberInput${index}`) as HTMLInputElement;
    const priceInput = document.getElementById(`${symbol}priceInput${index}`) as HTMLInputElement;

    // Emit a share-entered event if each input value is specified.
    if (dateInput.value && parseFloat(numberInput.value) > 0 && parseFloat(priceInput.value) >= 0) {
      this.shareEntered.emit(symbol);
    }
  }
}
