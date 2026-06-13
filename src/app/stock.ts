import { Article } from './article';
import { Company } from './company';
import { PriceData } from './pricedata';
import { Share } from './share';

/** A stock chosen from search or a news "related" chip, before it is loaded. */
export interface StockSelection {
  symbol: string;
  name: string;
}

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
  isCollapsed: boolean;
  updateChart: boolean;
}
