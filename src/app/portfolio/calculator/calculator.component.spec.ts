import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  it('gives the date input the yyyy-mm-dd form it can show, not the stored yyyy/mm/dd', () => {
    const calculator = Object.create(CalculatorComponent.prototype) as CalculatorComponent;
    const share = { date: '2026/07/15', dateError: null, number: 5, numberError: null, price: 1, priceError: null };
    expect(calculator.inputDate(share)).toBe('2026-07-15');
    expect(calculator.inputDate({ ...share, date: null })).toBeNull();
  });
});
