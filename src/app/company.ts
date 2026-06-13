// Subset of Alpha Vantage's company OVERVIEW response used by the app.
export interface Company {
  Symbol: string | null;
  Description: string | null;
  Name: string | null;
  PERatio: string | null;
  Exchange: string | null;
  Sector: string | null;
  Industry: string | null;
  AssetType: string | null;
}
