import { Share } from './share';
import { Stock } from './stock';

/** One stock as kept between visits: what the user chose and typed, never fetched data. */
export interface SavedStock {
  symbol: string;
  name: string;
  shares: Pick<Share, 'date' | 'number' | 'price'>[];
}

export const PORTFOLIO_KEY = 'marian.portfolio';

/* Keep the portfolio in this browser only. Storage can be missing or full (a
private window, a blocked site), and then the portfolio simply isn't kept. */
export function savePortfolio(stocks: Stock[]): void {
  const saved: SavedStock[] = stocks.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    // Keep any row the user started, without its errors or an empty trailing row.
    shares: stock.shares
      .filter((share) => share.date || share.number != null || share.price != null)
      .map(({ date, number, price }) => ({ date, number, price })),
  }));

  try {
    if (saved.length) {
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(saved));
    } else {
      localStorage.removeItem(PORTFOLIO_KEY);
    }
  } catch {
    // Not kept; the page still works.
  }
}

// The saved portfolio, or nothing when there is none or it can't be read.
export function loadPortfolio(): SavedStock[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(PORTFOLIO_KEY);
  } catch {
    return [];
  }
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const text = (value: unknown) => (typeof value === 'string' ? value : null);
    const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

    return parsed
      .filter((item) => item && typeof item.symbol === 'string' && typeof item.name === 'string')
      .map((item) => ({
        symbol: item.symbol,
        name: item.name,
        shares: (Array.isArray(item.shares) ? item.shares : []).map((share: Record<string, unknown>) => ({
          date: text(share?.['date']),
          number: num(share?.['number']),
          price: num(share?.['price']),
        })),
      }));
  } catch {
    return [];
  }
}
