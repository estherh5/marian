import { Component, OnInit, Input, ViewChild, ElementRef, Output,
  EventEmitter } from '@angular/core';

import * as moment from 'moment';
import { AmChartsService, AmChart } from '@amcharts/amcharts3-angular';

import { Stock } from '../../stock';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {
  private chart: AmChart;

  @Input() selectedStock: Stock;

  @Output() chartUpdated: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('chartdiv') chartdiv: ElementRef;

  constructor(private AmCharts: AmChartsService) { }

  ngOnInit(): void { }

  /* Create price history chart after component's view is initialized / its DOM
  elements are rendered */
  ngAfterViewInit(): void {
    return this.createChart();
  }

  // Recreate chart when update chart value is set to true
  ngDoCheck(): void {
    if (this.chart && this.selectedStock.updateChart) {
      this.AmCharts.destroyChart(this.chart);
      this.createChart();
      this.chartUpdated.emit(this.selectedStock.symbol);
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

  // Create price history chart
  createChart(): void {
    // Set initial date for trendline's initial value
    let initialDate;

    // Set initial date to last market day based on today's day of week
    new Date().getDay() === 1 && moment().utcOffset(-240).hours() +
      moment().utcOffset(-240).minutes()/60 < 9.5 ? (
        initialDate = moment().utcOffset(-240).date(new Date().getDate() - 4)
          .hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
      ) : new Date().getDay() === 1 || new Date().getDay() === 0 ? (
        initialDate = moment().utcOffset(-240).date(new Date().getDate() - 3)
          .hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
      ) : new Date().getDay() === 6 || moment().utcOffset(-240).hours() +
        moment().utcOffset(-240).minutes()/60 < 9.5 ? (
          initialDate = moment().utcOffset(-240).date(new Date().getDate() - 2)
            .hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
      ) : (
        initialDate = moment().utcOffset(-240).date(new Date().getDate() - 1)
          .hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
      );

    // Set initial value for trendline to last market day's close price
    let initialValue = this.selectedStock.priceHistory
      .find(obj => obj.date.getTime() == initialDate.getTime()).close;

    // Set initial date that will display on trendline
    let lineInitialDate;

    /* Set initial date to current market day at 9:30 AM EST or last market
    day at 9:30 AM EST if weekend or morning before 9:30 AM EST */
    new Date().getDay() === 1 && moment().utcOffset(-240).hours() + moment()
      .utcOffset(-240).minutes()/60 < 9.5 ? (
        lineInitialDate = moment().utcOffset(-240).date(new Date()
          .getDate() - 3).hours(9).minutes(30).seconds(0).milliseconds(0)
          .toDate()
      ) : new Date().getDay() === 0 ? (
        lineInitialDate = moment().utcOffset(-240).date(new Date()
          .getDate() - 2).hours(9).minutes(30).seconds(0).milliseconds(0)
          .toDate()
      ) :
      new Date().getDay() === 6 || moment().utcOffset(-240).hours() +
        moment().utcOffset(-240).minutes()/60 < 9.5 ? (
          lineInitialDate = moment().utcOffset(-240).date(new Date()
            .getDate() - 1).hours(9).minutes(30).seconds(0)
            .milliseconds(0).toDate()
        ) : (
          lineInitialDate = moment().utcOffset(-240).date(new Date().getDate())
            .hours(9).minutes(30).seconds(0).milliseconds(0).toDate()
        );

    // Set stock events to price history values with dividend prices specified
    let stockEvents: Array<object> = this.selectedStock.priceHistory
      .filter(stock => stock['dividend'] !== 0);

    stockEvents = stockEvents.map(stock => ({
      'date': stock['date'],
      'graph': 'g1',
      'text': 'D',
      'description': 'Dividend:<b> $' + parseFloat(stock['dividend'])
        .toFixed(2) + '</b>'
    }));

    // Set count for number of hours to display in 1 day price view
    let hourCount;

    /* Set count to full 6.5 hour market day if current day is weekend, weekday
    morning before 9:30 AM EST or weekeday afternoon after 4:00 PM EST, or set
    to number of hours' difference between current time and 9:30 AM EST */
    [0, 6].includes(new Date().getDay()) || (moment().utcOffset(-240).hours() +
      moment().utcOffset(-240).minutes()/60 < 9.5) || (moment().utcOffset(-240)
      .hours() > 16) ? hourCount = 6.5 : hourCount = moment().utcOffset(-240)
        .hours() + (moment().utcOffset(-240).minutes()/60) - 9.5;

    // Create price history amCharts stock chart with specified options
    this.chart = this.AmCharts.makeChart(this.chartdiv.nativeElement.id, {
      'type': 'stock',
      'theme': 'light',
      'categoryAxesSettings': {
        'dateFormats': [
          { period: 'mm', format: 'L:NN A' },
          { period: 'hh', format: 'L:NN A' },
          { period: 'DD', format: 'MMM DD' },
          { period: 'WW', format: 'MMM DD' },
          { period: 'MM', format: 'MMM' },
          { period: 'YYYY', format: 'YYYY' }
        ],
        'minPeriod': 'mm'
      },
      'dataSets': [ {
        'title': this.selectedStock.symbol,
        'color': '#21c6ce',
        'fieldMappings': [ {
          'fromField': 'close',
          'toField': 'close'
        }, {
          'fromField': 'volume',
          'toField': 'volume'
        } ],
        'categoryField': 'date',
        'dataProvider': this.selectedStock.priceHistory,
        'stockEvents': stockEvents
      } ],
      'stockEventsSettings': {
        'backgroundColor': '#ffffff',
        'balloonColor': '#b9b9b9',
        'borderColor': '#21c6ce',
        'rollOverColor': '#21c6ce',
        'type': 'sign'
      },
      'panels': [ {
        'title': 'Price',
        'stockGraphs': [ {
          'id': 'g1',
          'valueField': 'close',
          'comparable': true,
          'compareField': 'value',
          'balloonText': '[[title]]:<b> $[[value]]</b>',
          'compareGraphBalloonText': '[[title]]:<b> $[[value]]</b>'
        } ],
        'stockLegend': {
          'periodValueTextComparing': '[[percents.value.close]]%',
          'periodValueTextRegular': '$[[value.close]]',
          'valueTextRegular': '$[[value]]'
        },
        'trendLines': [ {
          'finalDate': this.selectedStock
            .priceHistory[this.selectedStock.priceHistory.length - 1].date,
          'finalValue': this.selectedStock
            .priceHistory[this.selectedStock.priceHistory.length - 1].close,
          'initialDate': lineInitialDate,
          'initialValue': initialValue,
          'lineColor': this.selectedStock.priceHistory[this.selectedStock
            .priceHistory.length - 1].close > initialValue ? '#05d405' :
              '#ff0000',  // Set line color to red/green
          'lineThickness': 1
        } ]
      }, {
        'title': 'Volume',
        'percentHeight': 30,
        'stockGraphs': [ {
          'valueField': 'volume',
          'type': 'column',
          'showBalloon': false,
          'fillAlphas': 1
        } ],
        'stockLegend': {
          'periodValueTextRegular': '[[close]]'
        }
      } ],
      'chartScrollbarSettings': {
        'enabled': false
      },
      'chartCursorSettings': {
        'zoomable': false,
        'valueBalloonsEnabled': true,
        'fullWidth': true,
        'cursorAlpha': 0.1,
        'valueLineBalloonEnabled': true,
        'valueLineEnabled': true,
        'valueLineAlpha': 0.5
      },
      'periodSelector': {
        'periods': [ {
          'period': 'hh',
          'count': hourCount,
          'selected': true,
          'label': '1 day'
        }, {
          'period': 'DD',
          'count': 14,
          'label': '2 weeks'
        }, {
          'period': 'MM',
          'count': 1,
          'label': '1 month'
        }, {
          'period': 'YYYY',
          'count': 1,
          'label': '1 year'
        }, {
          'period': 'YYYY',
          'count': 5,
          'label': '5 years'
        }, {
          'period': 'MAX',
          'label': 'All'
        } ],
        'position': 'top',
        'periodsText': '',
        'inputFieldsEnabled': false,
        'listeners': [ {
          'event': 'changed',
          'method': event => { this.chart && this.chart.panels ?
            /* Update chart trendline when period is changed if chart and its
            panels are rendered */
            this.AmCharts.updateChart(this.chart, () => {
              // Set initial value for trendline
              let startValue;

              // If 1 day view is selected, set trendline based on today's date
              if (event.predefinedPeriod === 'hh') {
                // Set initial date for trendline's initial value
                let startDate;

                /* Set initial date to last market day based on today's day of
                week */
                new Date().getDay() === 1 && moment().utcOffset(-240).hours() +
                  moment().utcOffset(-240).minutes()/60 < 9.5 ? (
                    startDate = moment().utcOffset(-240).date(new Date()
                      .getDate() - 4).hours(0).minutes(0).seconds(0)
                      .milliseconds(0).toDate()
                  ) : new Date().getDay() === 1 || new Date().getDay() === 0 ? (
                    startDate = moment().utcOffset(-240).date(new Date()
                      .getDate() - 3).hours(0).minutes(0).seconds(0)
                      .milliseconds(0).toDate()
                  ) : new Date().getDay() === 6 || moment().utcOffset(-240)
                    .hours() + moment().utcOffset(-240).minutes()/60 < 9.5 ? (
                      startDate = moment().utcOffset(-240).date(new Date()
                        .getDate() - 2).hours(0).minutes(0).seconds(0)
                        .milliseconds(0).toDate()
                  ) : (
                    startDate = moment().utcOffset(-240).date(new Date()
                      .getDate() - 1).hours(0).minutes(0).seconds(0)
                      .milliseconds(0).toDate()
                  );

                /* Set initial value for trendline to last market day's close
                price */
                startValue = this.selectedStock.priceHistory.find(obj => obj
                  .date.getTime() == startDate.getTime()).close;

              }

              /* If other period view is selected, set trendline starting value
              to closest price history date (giving range of +/- 2 days because
              of weekends/holidays) */
              else {
                startValue = this.selectedStock.priceHistory.find(obj => obj
                  .date.getDate() >= event.startDate.getDate() - 2 && obj
                  .date.getDate() <= event.startDate.getDate() + 2 && obj
                  .date.getMonth() === event.startDate.getMonth() && obj.date
                  .getFullYear() === event.startDate.getFullYear()).close;
              }

              this.chart.panels[0].trendLines = [{
                'finalDate': event.endDate,
                'finalValue': this.selectedStock.priceHistory[this
                  .selectedStock.priceHistory.length - 1].close,
                'initialDate': event.startDate,
                'initialValue': startValue,
                'lineColor': this.selectedStock.priceHistory[this
                  .selectedStock.priceHistory.length - 1].close > startValue ?
                  '#05d405' : '#ff0000',  // Set line color to red/green
                'lineThickness': 1
              }];
            }) : (null)
          }
        } ]
      },
      'panelsSettings': {
        'precision': 2,
        'usePrefixes': true,
        'fontFamily': '\'Open Sans\', sans-serif'
      },
      'valueAxesSettings': {
        'precision': 2,
        'unit': '$',
        'unitPosition': 'left'
      }
    } );

    return;
  }
}
