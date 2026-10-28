import { loadPortfolio, PORTFOLIO_KEY, savePortfolio } from './portfolio-store';
import { Stock } from './stock';

function stock(symbol: string, shares: Stock['shares']): Stock {
  return {
    symbol, name: `${symbol} Inc`, shares, isRising: null, price: null, change: null, changePercent: null,
    priceHistory: [], company: {}, news: [], isCollapsed: false, updateChart: false,
    load: { quote: 'ready', history: 'ready', company: 'ready', news: 'ready' },
  };
}

const empty = { date: null, dateError: null, number: null, numberError: null, price: null, priceError: null };

describe('portfolio store', () => {
  beforeEach(() => localStorage.clear());

  it('keeps symbols and typed purchases, drops errors and the empty row', () => {
    savePortfolio([stock('AAPL', [
      { ...empty, date: '2026/07/15', number: 3, price: 210.5, priceError: '' },
      { ...empty, number: 2 },
      empty,
    ])]);
    expect(loadPortfolio()).toEqual([{
      symbol: 'AAPL', name: 'AAPL Inc',
      shares: [{ date: '2026/07/15', number: 3, price: 210.5 }, { date: null, number: 2, price: null }],
    }]);
  });

  it('forgets the portfolio when the last stock goes', () => {
    savePortfolio([stock('AAPL', [empty])]);
    savePortfolio([]);
    expect(localStorage.getItem(PORTFOLIO_KEY)).toBeNull();
  });

  it('reads damaged storage as no portfolio', () => {
    localStorage.setItem(PORTFOLIO_KEY, '{not json');
    expect(loadPortfolio()).toEqual([]);
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify([{ symbol: 1 }, { symbol: 'MSFT', name: 'Microsoft', shares: [{ number: 'x', price: 4 }] }]));
    expect(loadPortfolio()).toEqual([{ symbol: 'MSFT', name: 'Microsoft', shares: [{ date: null, number: null, price: 4 }] }]);
  });

  it('carries on when storage throws', () => {
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded'); });
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    expect(() => savePortfolio([stock('AAPL', [empty])])).not.toThrow();
    expect(loadPortfolio()).toEqual([]);
    set.mockRestore();
    get.mockRestore();
  });
});
