export interface Article {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  // Raw API value is a comma-delimited string; normalized to a list of known
  // symbols when news is loaded (see AppComponent.getStockNews).
  related: string[];
  source: string;
  summary: string;
  url: string;
}
