import { Component, OnInit, Input, Output, HostListener, EventEmitter,
  ViewChild, ElementRef } from '@angular/core';

import * as algoliasearch from 'algoliasearch';
const algoliasearch = require('algoliasearch/dist/algoliasearch.js');

import { Stock } from '../stock';
import { SearchService } from './search.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  @Input() selectedStocks: Stock[];
  @Input() isLandingPage: boolean;

  @Output() stockSelected: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('searchBar') searchBar: ElementRef;
  @ViewChild('searchButton') searchButton: ElementRef;
  @ViewChild('stocksList') stocksList: ElementRef;

  client = algoliasearch('ABHYDU4YXO', '14318eab1436b71c4b597e19d10b9d61');

  index = this.client.initIndex('stocks');

  noneFound: boolean;

  searchResults: Array<any>;

  constructor(private searchService: SearchService) { }

  ngOnInit(): void { }

  // Hide search results list if user clicks outside of component
  @HostListener('document:click', ['$event'])
  clickedOutsideInput(event: any): void {
    if (event.target !== this.searchBar && event.target !==
      this.searchButton && !this.stocksList.nativeElement
      .contains(event.target)) {
        this.stocksList.nativeElement.style.display = 'none';
      }

    return;
  }

  // Set specified stock as selected when user hovers over it
  hoverOverStock(stock: any): boolean {
    // Remove selected status from all stocks
    this.searchResults.map(obj => obj.selected = false);

    // Get index of specified stock
    let stockIndex = this.searchResults.findIndex(obj => obj
      .symbol === stock.symbol);

    // Set specified stock to selected
    return this.searchResults[stockIndex].selected = true;
  }

  // Get stock search results list from Algolia search
  getSearchResults(phrase): void {
    this.index.search({
      query: phrase
    }, (err, content) => {
      this.searchResults = content.hits;

      // Filter out stocks that are already in the user's portfolio
      this.searchResults = this.searchResults.filter(stock => this
        .selectedStocks.every(obj => obj.symbol !== stock.symbol));

      // If there are no stocks found, display no results found message
      if (this.searchResults.length === 0) {
        this.noneFound = true;

        this.stocksList.nativeElement.style.display = 'block';
      }

      // Otherwise, display a max of 8 stocks in the search results list
      else {
        this.noneFound = false;

        this.searchResults = this.searchResults.slice(0, 8);

        // Remove selected status from all stocks
        this.searchResults.map(stock => stock.selected = false);

        // Set first stock to selected
        this.searchResults[0].selected = true;

        this.stocksList.nativeElement.style.display = 'block';
      }
    });

    return;
  }

  // Search for stocks when user types in search bar
  searchStocks(event: any): any {
    /* If there is a value in the search bar, check what key the user clicked
    and/or search for stocks */
    if (this.searchBar.nativeElement.value) {
      /* Hover over next stock in search results list when user clicks down
      arrow */
      if (event.key === 'ArrowDown') {
        // Get index of currently selected stock
        let stockIndex = this.searchResults.findIndex(stock => stock
          .selected === true);

        this.searchResults[stockIndex].selected = false;

        /* Hover over first stock in search results list if previously selected
        stock is last in list */
        if (stockIndex === this.searchResults.length - 1) {
          return this.searchResults[0].selected = true;
        }

        return this.searchResults[stockIndex + 1].selected = true;
      }

      /* Hover over previous stock in search results list when user clicks up
      arrow */
      if (event.key === 'ArrowUp') {
      // Get index of currently selected stock
      let stockIndex = this.searchResults.findIndex(stock => stock
        .selected === true);

        this.searchResults[stockIndex].selected = false;

        /* Hover over last stock in search results list if previously selected
        stock is first in list */
        if (stockIndex === 0) {
          return this.searchResults[this.searchResults.length - 1]
            .selected = true;
        }

        return this.searchResults[stockIndex - 1].selected = true;
      }

      /* Select stock when user clicks enter if there is a value in the search
      bar and there is at least one search result in the search results list */
      if (event.key === 'Enter') {
        if (this.searchBar.nativeElement.value) {

          if (this.searchResults.length > 0) {
            // Find stock that has selected status
            var selected = this.searchResults.find(stock => stock
              .selected === true);

            return this.selectStock(selected);
          }
        }
        return;
      }

      // Request stocks based on the value in the search bar
      this.getSearchResults(this.searchBar.nativeElement.value);
    }

    // Otherwise, hide the search results list
    else {
      this.stocksList.nativeElement.style.display = 'none';
    }

    return;
  }

  // Emit stock selected event when user selects specified stock
  selectStock(stock: any): void {
    // Clear search bar value
    this.searchBar.nativeElement.value = '';

    // Hide stock search results list
    this.stocksList.nativeElement.style.display = 'none';

    return this.stockSelected.emit(stock);
  }
}
