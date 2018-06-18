import { Article } from './article';
import { Company } from './company';
import { PriceData } from './pricedata';
import { Share } from './share';

export class Stock {
  symbol: string;
  name: string;
  shares: Share[];
  isRising: boolean;
  price: number;
  change: number;
  changePercent: number;
  peRatio: number;
  priceHistory: PriceData[];
  company: Company;
  news: Article[];
  isCollapsed: boolean;
  updateChart: boolean;
}
