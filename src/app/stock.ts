import { Article } from './article';
import { Company } from './company';
import { PriceData } from './pricedata';
import { Share } from './share';

/** A stock chosen from search or a news "related" chip, before it is loaded. */
export interface StockSelection {
  symbol: string;
  name: string;
}

/** Where one of a stock's four requests stands. Empty is a ready list with no rows. */
export type LoadState = 'loading' | 'ready' | 'error';

/** The four requests that fill a stock's card. */
export type StockPart = 'quote' | 'history' | 'company' | 'news';

export interface Stock {
  symbol: string;
  name: string;
  shares: Share[];
  isRising: boolean | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  priceHistory: PriceData[];
  company: Company;
  news: Article[];
  load: Record<StockPart, LoadState>;
  isCollapsed: boolean;
  updateChart: boolean;
}
