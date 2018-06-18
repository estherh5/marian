import { Component, OnInit, Input, Output, ViewChild, ElementRef,
  EventEmitter } from '@angular/core';

import * as moment from 'moment';
import { AmChartsService, AmChart } from "@amcharts/amcharts3-angular";
import cloneDeep from 'lodash/cloneDeep';

import { Share } from '../share';
import { Stock } from '../stock';

@Component({
  selector: 'app-net-chart',
  templateUrl: './net-chart.component.html',
  styleUrls: ['./net-chart.component.css']
})
export class NetChartComponent implements OnInit {
  private chart: AmChart;

  @Input() selectedStocks: Stock[];
  @Input() update: boolean;

  @Output() chartUpdated: EventEmitter<any> = new EventEmitter<any>();
  @Output() optionUpdated: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('chartdiv') chartdiv: ElementRef;

  buttonText: string = 'Toggle $';

  period: string = '1 day';

  type: string = 'percent';

  constructor(private AmCharts: AmChartsService) { }

  ngOnInit(): void { }

  /* Create net equity chart after component's view is initialized / its DOM
  elements are rendered */
  ngAfterViewInit(): void {
    return this.createChart();
  }

  ngDoCheck(): void {
    // Recreate chart when update value is set to true
    if (this.chart && this.update) {
      this.AmCharts.destroyChart(this.chart);
      this.createChart();
      this.chartUpdated.emit();
    }

    return;
  }

  // Remove chart when component gets destroyed
  ngOnDestroy(): void {
    if (this.chart) {
      this.AmCharts.destroyChart(this.chart);
    }

    return;
  }

  // Create net equity chart
  createChart(): void {
    let dataSets = [];  // Array of all datasets for stock chart
    let allDatapoints = [];  // Array of all data points for stock chart
    let stockGraphs = [];  // Array of stock graphs to add to stock chart

    let stocks = cloneDeep(this.selectedStocks);

    // Define colors that should be used for each stock line in the chart
    const colors = ["#FCD202", "#0D8ECF", "#2A0CD0", "#CD0D74", "#CC0000",
      "#00CC00", "#0000CC", "#DDDDDD", "#999999", "#333333", "#990000"];

    // Set count for number of hours to display in 1 day price view
    let hourCount;

    /* Set count to full 6.5 hour market day if current day is weekend, weekday
    morning before 9:30 AM EST or weekeday afternoon after 4:00 PM EST, or set
    to number of hours' difference between current time and 9:30 AM EST */
    [0, 6].includes(new Date().getDay()) || (moment().utcOffset(-240).hours() +
      moment().utcOffset(-240).minutes()/60 < 9.5) || (moment().utcOffset(-240)
      .hours() > 16) ? hourCount = 6.5 : hourCount = moment().utcOffset(-240)
        .hours() + (moment().utcOffset(-240).minutes()/60) - 9.5;

    stocks.map(stock => {
      /* Filter out shares that have errors or are missing purchase date, share
      number and/or price per share for each stock */
      stock.shares = stock.shares.filter(share => !share.dateError &&
        !share.numberError && !share.priceError && share.date &&
        share.number && (share.price || share.price === 0));

      // Sort shares from oldest to newest purchase date
      stock.shares.sort((a, b) => new Date(a.date).getTime() - new Date(b.date)
        .getTime());
    });

    // Filter out stocks that have no shares after share filtering
    stocks = stocks.filter(stock => stock.shares.length > 0);

    // Sort stocks by oldest share's purchase date
    stocks.sort((a, b) => new Date(a.shares[0].date).getTime() - new Date(b
      .shares[0].date).getTime());


    // Create list of data points for each stock
    stocks.map((stock, i) => {
      let dataProvider = [];

      // Filter price history to prices from oldest share's purchase date on
      stock.priceHistory = stock.priceHistory
        .filter(price => price.date.getTime() >= new Date(stock.shares[0]
          .date + 'GMT' + -(new Date().getTimezoneOffset()/60)).getTime());

      /* Copy price history to have original stock prices available for
      calculations */
      let priceHistoryCopy = cloneDeep(stock.priceHistory);

      // Calculate net equity at each point in price history for each share
      stock.priceHistory.map((price, index) => {

        /* Set stock close price to net equity by multiplying stock close
        rice by number of shares and subtracting amount user paid for
        shares */
        stock.shares.map((share, ind) => {
          /* Set stock close price to net equity for initial price point and
          oldest share */
          if (ind === 0) {
            price.close = price.close * share.number -
              (parseFloat(share.price) * share.number);

            // Set number of shares for price point
            price.shares = share.number;
          }

          /* Set stock close price to net equity for each price on or after
          subsequent shares' purchase dates */
          else if (ind > 0 && price.date.getTime() >= new Date(share.date +
            'GMT' + -(new Date().getTimezoneOffset()/60)).getTime()) {
              price.close = price.close +
                (priceHistoryCopy[index].close * share.number) -
                (parseFloat(share.price) * share.number);

              // Increment number of shares for price point
              price.shares += share.number;
            }
        });

        // Add dividend to close price if it exists for price point
        if (price.dividend !== 0) {
          price.close += price.dividend;
        }

        dataProvider.push(price);
        allDatapoints.push(price);
      });

      /* Set stock events to price history values with dividend prices
      specified */
      let stockEvents: Array<Object> = stock.priceHistory
        .filter(price => price['dividend'] !== 0);

      stockEvents = stockEvents.map((event, index) => ({
        "date": event['date'],
        "graph": "g" + (i + 1).toString(),
        "text": "D",
        "description": "Dividend:<b> $" + event['dividend'].toFixed(2) +
          '</b>',
        "borderColor": colors[i],
        "backgroundColor": "#ffffff",
        "rollOverColor": colors[i]
      }));

      // Create dataset for stock that has net equity history
      dataSets.push({
        "title": stock.symbol,
        "compared": i > 0 ? true : null,
        "fieldMappings": [ {
          "fromField": "close",
          "toField": i > 0 ? "close" + (i + 1).toString() : "close"
        } ],
        "categoryField": "date",
        "dataProvider": dataProvider,
        "stockEvents": stockEvents
      });

      // Create stock graph for stock
      stockGraphs.push({
        "id": "g" + (i + 1).toString(),
        "negativeLineColor": "#ff0000",
        "lineColor": colors[i],
        "balloonColor": colors[i],
        "showEventsOnComparedGraphs": true,
        "negativeBase": this.type === 'percent' ? 0 : stock.priceHistory[0]
          .close,
        "compareGraphLineThickness": 1,
        "compareGraph": {
          "lineColor": colors[i],
          "balloonColor": colors[i],
          "negativeLineColor": "#ff0000",
          "showEventsOnComparedGraphs": true,
          "negativeBase": this.type === 'percent' ? 0 : stock.priceHistory[0]
            .close
        },
        "valueField": i > 0 ? "close" + (i + 1).toString() : "close",
        "compareField": i > 0 ? "close" + (i + 1).toString() : "close",
        "comparable": true,
        "balloonText": this.type === 'percent' ? (
          "[[title]]:<b> [[percents.value]]%</b>") : (
          "[[title]]:<b> $[[value]]</b>"),
        "compareGraphBalloonText": this.type === 'percent' ? (
          "[[title]]:<b> $[[percents.value]]%</b>") : (
          "[[title]]:<b> $[[value]]</b>")
      });
    });

    // Create a net equity line if user has shares of more than one stock
    if (stocks.length > 1) {
      // Sort data points for all stock datasets from oldest to newest
      allDatapoints.sort((a, b) => new Date(a.date).getTime() -
        new Date(b.date).getTime());

      /* Get initial price to compare rising and falling prices against by
      adding oldest stock(s)' net equity together */
      let initialPrice = allDatapoints.filter(price => price.date
        .getTime() === new Date(allDatapoints[0].date).getTime());

      initialPrice = initialPrice.reduce((a, b) => a.close + b.close);

      /* Create array of dates that have been iterated through from all stocks'
      data points */
      let dates = [];

      // Create list of data points for net equity line
      let dataProvider = [];

      allDatapoints.map(price => {
        /* If data point's date has not been encountered yet, add it to the
        dates array and add its price data to the net equity chart's list of
        data points */
        if (!dates.includes(price.date.getTime())) {
          dates.push(price.date.getTime());

          dataProvider.push({
            date: price.date,
            close: price.close,
            shares: price.shares,
            dividends: price.dividend,
            color: '#05d405'
          });
        }

        /* Otherwise, if data point's date has been encountered already,
        increment previous price data for the date with current data point's
        data */
        else {
          // Get index of previous price data for the current data point's date
          let index = dataProvider.findIndex(obj => obj.date
            .getTime() === price.date.getTime());

          dataProvider[index].close += price.close;

          dataProvider[index].shares += price.shares;

          dataProvider[index].dividends += price.dividend;

          dataProvider[index].color = '#05d405';
        }
      });

      // Create net equity line dataset
      dataSets.push({
        "title": 'Net',
        "compared": true,
        "fieldMappings": [ {
          "fromField": "close",
          "toField": "close" + (stocks.length + 1).toString()
        } ],
        "categoryField": "date",
        "dataProvider": dataProvider
      });

      // Create net equity line stock graph
      stockGraphs.push({
        "id": "g" + (stocks.length + 1).toString(),
        "negativeLineColor": "#ff0000",
        "negativeBase": this.type === 'percent' ? 0 : initialPrice,
        "lineColorField": "color",
        "valueField": "close" + (stocks.length + 1).toString(),
        "compareField": "close" + (stocks.length + 1).toString(),
        "compareGraphLineThickness": 1,
        "showEventsOnComparedGraphs": true,
        "comparable": true,
        "compareGraph": {
          "legendColor": "#05d405",
          "showEventsOnComparedGraphs": true,
          "negativeLineColor": "#ff0000",
          "negativeBase": this.type === 'percent' ? 0 : initialPrice,
        },
        "balloonText": this.type === 'percent' ? (
          "[[title]]:<b> [[percents.value]]%</b>") : (
          "[[title]]:<b> $[[value]]</b>"),
        "compareGraphBalloonText": this.type === 'percent' ? (
          "[[title]]:<b> $[[percents.value]]%</b>") : (
          "[[title]]:<b> $[[value]]</b>")
      });
    }

    // Create net equity amCharts stock chart with specified options
    this.chart = this.AmCharts.makeChart(this.chartdiv.nativeElement.id, {
      "type": "stock",
      "theme": "light",
      "colors": colors,
      "dataSets": dataSets,
      "categoryAxesSettings": {
        "minPeriod": "mm"
      },
      "panels": [ {
        "title": "Equity",
        "stockGraphs": stockGraphs,
        "stockLegend": {
          "periodValueText": this.type === 'percent' ? (
            "[[percents.value.close]]%") : ("$[[value.close]]"),
          "valueTextRegular": this.type === 'percent' ? (
            "[[percents.value]]%</b>") : ("$[[value]]"),
          "periodValueTextRegular": this.type === 'percent' ? (
            "[[percents.value.close]]%") : ("$[[value.close]]")
        }
      } ],
      "chartScrollbarSettings": {
        "enabled": false
      },
      "chartCursorSettings": {
        "zoomable": false,
        "valueBalloonsEnabled": true,
        "fullWidth": true,
        "cursorAlpha": 0.1,
        "valueLineBalloonEnabled": true,
        "valueLineEnabled": true,
        "valueLineAlpha": 0.5
      },
      "periodSelector": {
        "periods": [ {
          "period": "hh",
          "selected": this.period === '1 day' ? true : false,
          "count": hourCount,
          "label": "1 day"
        }, {
          "period": "MM",
          "selected": this.period === '1 month' ? true : false,
          "count": 1,
          "label": "1 month"
        }, {
          "period": "YYYY",
          "selected": this.period === '1 year' ? true : false,
          "count": 1,
          "label": "1 year"
        }, {
          "period": "YYYY",
          "selected": this.period === '5 years' ? true : false,
          "count": 5,
          "label": "5 years"
        }, {
          "period": "MAX",
          "selected": this.period === 'All' ? true : false,
          "label": "All"
        } ],
        "dateFormat": "MM-DD-YYYY",
        "position": 'top',
        "periodsText": '',
        "inputFieldsEnabled": false,
        "listeners": [ {
          "event": "changed",
          "method": event => {
            event.event ? this.period = event.event.target.value : null
          }
        } ]
      },
      "panelsSettings": {
        "precision": 2,
        "recalculateToPercents": this.type === 'percent' ? "always" : "never",
        "usePrefixes": true,
        "fontFamily": "'Open Sans', sans-serif"
      },
      "valueAxesSettings": {
        "precision": this.type === 'percent' ? 1 : 2,
        "unit": this.type === 'percent' ? "%" : "$",
        "unitPosition": this.type === 'percent' ? "right" : "left"
      },
      "stockEventsSettings": {
        "balloonColor": "#b9b9b9"
      }
    } );

    return;
  }

  // Toggle net equity chart's y-axis to display % or $ units
  toggleAxis(): void {
    // If current axis type is percent, switch to price and update button text
    if (this.type === 'percent') {
      this.type = 'price';
      this.buttonText = 'Toggle %';
    }

    // Otherwise, switch to percent and update button text
    else {
      this.type = 'percent';
      this.buttonText = 'Toggle $';
    }

    // Emit toggle option updated event to trigger update of net equity chart
    return this.optionUpdated.emit();
  }
}
