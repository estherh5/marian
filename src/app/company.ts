// Subset of Finnhub's company profile (stock/profile2) used by the app. A fund
// or unknown symbol comes back as `{}`, so every field may be missing.
export interface Company {
  ticker?: string;
  name?: string;
  exchange?: string;
  finnhubIndustry?: string;
  country?: string;
  ipo?: string;
  // In millions of the listing currency.
  marketCapitalization?: number;
  currency?: string;
  weburl?: string;
}
