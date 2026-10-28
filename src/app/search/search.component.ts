import { ChangeDetectorRef, Component, ElementRef, HostListener, inject, input, output, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { algoliasearch, type SearchClient } from 'algoliasearch';

import { Stock, StockSelection } from '../stock';

interface SearchResult {
  objectID: string;
  symbol: string;
  name: string;
  selected?: boolean;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  imports: [NgClass],
})
export class SearchComponent {
  readonly selectedStocks = input.required<Stock[]>();
  readonly isLandingPage = input.required<boolean>();

  readonly stockSelected = output<StockSelection>();

  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly searchBar = viewChild.required<ElementRef<HTMLInputElement>>('searchBar');
  readonly searchButton = viewChild.required<ElementRef<HTMLButtonElement>>('searchButton');
  readonly stocksList = viewChild.required<ElementRef<HTMLElement>>('stocksList');

  private readonly indexName = 'stocks';
  private readonly client: SearchClient = algoliasearch(
    'ABHYDU4YXO',
    '14318eab1436b71c4b597e19d10b9d61',
  );

  noneFound = false;
  searchResults: SearchResult[] = [];

  // The query the shown results answer. Responses can land out of order, so
  // only the one for the latest query is kept.
  private resultsQuery = '';
  private latestQuery = '';

  // Set when Enter is pressed before the latest query's results arrive.
  private selectOnArrival = false;

  // Hide the search results list if the user clicks outside of the component.
  @HostListener('document:click', ['$event'])
  clickedOutsideInput(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      target !== this.searchBar().nativeElement &&
      target !== this.searchButton().nativeElement &&
      !this.stocksList().nativeElement.contains(target)
    ) {
      this.stocksList().nativeElement.style.display = 'none';
    }
  }

  // Mark the specified stock as selected when the user hovers over it.
  hoverOverStock(stock: SearchResult): void {
    this.searchResults.forEach((obj) => (obj.selected = obj.symbol === stock.symbol));
  }

  // Get the stock search results list from Algolia search.
  async getSearchResults(phrase: string): Promise<void> {
    this.latestQuery = phrase;
    const { hits } = await this.client.searchSingleIndex<SearchResult>({
      indexName: this.indexName,
      searchParams: { query: phrase },
    });

    // A slower response for an earlier keystroke would replace newer results.
    if (phrase !== this.latestQuery) {
      return;
    }
    this.resultsQuery = phrase;

    // Filter out stocks that are already in the user's portfolio.
    const selected = this.selectedStocks();
    let results = hits.filter((stock) => selected.every((obj) => obj.symbol !== stock.symbol));

    // If there are no stocks found, display the no-results message.
    if (results.length === 0) {
      this.selectOnArrival = false;
      this.noneFound = true;
      this.searchResults = [];
      this.stocksList().nativeElement.style.display = 'block';
      this.changeDetector.detectChanges();
      return;
    }

    // Otherwise, display a max of 8 stocks in the search results list.
    this.noneFound = false;
    results = results.slice(0, 8);
    results.forEach((stock) => (stock.selected = false));
    results[0].selected = true;
    this.searchResults = results;
    this.stocksList().nativeElement.style.display = 'block';

    // The Algolia client resolves outside Angular's zone, so nothing would
    // render the rows until the next keystroke.
    this.changeDetector.detectChanges();

    if (this.selectOnArrival) {
      this.selectOnArrival = false;
      this.selectStock(results[0]);
    }
  }

  // Search for stocks when the user types in the search bar (or clicks search).
  searchStocks(event: KeyboardEvent | MouseEvent): void {
    const searchValue = this.searchBar().nativeElement.value;
    const key = 'key' in event ? event.key : undefined;

    // If the search bar is empty, hide the search results list.
    if (!searchValue) {
      this.stocksList().nativeElement.style.display = 'none';
      return;
    }

    // Move the highlight to the next result on ArrowDown.
    if ((key === 'ArrowDown' || key === 'ArrowUp') && this.searchResults.length === 0) {
      return;
    }
    if (key === 'ArrowDown') {
      const index = this.searchResults.findIndex((stock) => stock.selected);
      this.searchResults[index].selected = false;
      const next = index === this.searchResults.length - 1 ? 0 : index + 1;
      this.searchResults[next].selected = true;
      return;
    }

    // Move the highlight to the previous result on ArrowUp.
    if (key === 'ArrowUp') {
      const index = this.searchResults.findIndex((stock) => stock.selected);
      this.searchResults[index].selected = false;
      const previous = index === 0 ? this.searchResults.length - 1 : index - 1;
      this.searchResults[previous].selected = true;
      return;
    }

    // Select the highlighted stock on Enter when there is at least one result.
    if (key === 'Enter') {
      // The list still shows an earlier query's matches: pick from the next one.
      if (this.resultsQuery !== searchValue) {
        this.selectOnArrival = true;
        if (this.latestQuery !== searchValue) {
          void this.getSearchResults(searchValue);
        }
        return;
      }
      if (this.searchResults.length > 0) {
        const selected = this.searchResults.find((stock) => stock.selected);
        if (selected) {
          this.selectStock(selected);
        }
      }
      return;
    }

    // Ignore keys that don't change the query (Shift, Tab, sideways arrows).
    // A click on the search button always searches.
    if (key !== undefined && searchValue === this.latestQuery) {
      return;
    }

    // Otherwise, request stocks based on the value in the search bar.
    void this.getSearchResults(searchValue);
  }

  // Emit a stock-selected event when the user selects the specified stock.
  selectStock(stock: SearchResult): void {
    // Clear the search bar value.
    this.searchBar().nativeElement.value = '';
    this.latestQuery = '';
    this.resultsQuery = '';
    this.searchResults = [];

    // Hide the stock search results list.
    this.stocksList().nativeElement.style.display = 'none';

    this.stockSelected.emit({ symbol: stock.symbol, name: stock.name });
  }
}
