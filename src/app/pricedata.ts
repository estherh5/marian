export interface PriceData {
  date: Date;
  close: number;
  volume: number;
  dividend: number;

  // Fields computed while building the net-equity chart.
  shares?: number;
  invested?: number;
  percent?: number;
  dividends?: number;
  color?: string;
}
