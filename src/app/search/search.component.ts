import { Component, ElementRef, HostListener, input, output, viewChild } from '@angular/core';
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
    const { hits } = await this.client.searchSingleIndex<SearchResult>({
      indexName: this.indexName,
      searchParams: { query: phrase },
    });

    // Filter out stocks that are already in the user's portfolio.
    const selected = this.selectedStocks();
    let results = hits.filter((stock) => selected.every((obj) => obj.symbol !== stock.symbol));

    // If there are no stocks found, display the no-results message.
    if (results.length === 0) {
      this.noneFound = true;
      this.searchResults = [];
      this.stocksList().nativeElement.style.display = 'block';
      return;
    }

    // Otherwise, display a max of 8 stocks in the search results list.
    this.noneFound = false;
    results = results.slice(0, 8);
    results.forEach((stock) => (stock.selected = false));
    results[0].selected = true;
    this.searchResults = results;
    this.stocksList().nativeElement.style.display = 'block';
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
      if (this.searchResults.length > 0) {
        const selected = this.searchResults.find((stock) => stock.selected);
        if (selected) {
          this.selectStock(selected);
        }
      }
      return;
    }

    // Otherwise, request stocks based on the value in the search bar.
    void this.getSearchResults(searchValue);
  }

  // Emit a stock-selected event when the user selects the specified stock.
  selectStock(stock: SearchResult): void {
    // Clear the search bar value.
    this.searchBar().nativeElement.value = '';

    // Hide the stock search results list.
    this.stocksList().nativeElement.style.display = 'none';

    this.stockSelected.emit({ symbol: stock.symbol, name: stock.name });
  }
}
