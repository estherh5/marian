/** Payload emitted when a share row is removed from a stock. */
export interface ShareRemoval {
  symbol: string;
  index: number;
}

export interface Share {
  date: string | null;
  dateError: string | null;
  number: number | null;
  numberError: string | null;
  price: number | null;
  priceError: string | null;
}
