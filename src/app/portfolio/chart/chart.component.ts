import {
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5stock from '@amcharts/amcharts5/stock';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

import { PriceData } from '../../pricedata';
import { Stock } from '../../stock';

const SERIES_COLOR = 0x21c6ce;
const UP_COLOR = 0x05d405;
const DOWN_COLOR = 0xff0000;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements AfterViewInit, DoCheck, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly selectedStock = input.required<Stock>();

  readonly chartUpdated = output<string>();

  readonly chartDiv = viewChild.required<ElementRef<HTMLElement>>('chartdiv');
  readonly toolbarDiv = viewChild.required<ElementRef<HTMLElement>>('toolbar');

  private root?: am5.Root;
  private built = false;
  private disposed = false;

  // Build the chart once the view (DOM) is ready. Emitting chartUpdated clears
  // the parent's update flag so ngDoCheck does not immediately rebuild.
  ngAfterViewInit(): void {
    this.build();
    this.chartUpdated.emit(this.selectedStock().symbol);
  }

  // Rebuild only when the price history is refreshed after the initial build.
  ngDoCheck(): void {
    if (this.built && this.selectedStock().updateChart) {
      this.build();
      this.chartUpdated.emit(this.selectedStock().symbol);
    }
  }

  ngOnDestroy(): void {
    this.disposed = true;
    this.disposeChart();
  }

  private build(): void {
    this.built = true;
    this.disposeChart();
    // Defer one frame so the container has its final layout before amCharts
    // measures it — creating synchronously can leave the chart sized 0 until
    // the next reflow.
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        if (!this.disposed) {
          this.createChart();
        }
      });
    });
  }

  private disposeChart(): void {
    this.root?.dispose();
    this.root = undefined;
  }

  private createChart(): void {
    const stock = this.selectedStock();
    const data = stock.priceHistory.map((point) => ({ ...point, date: point.date.getTime() }));
    if (data.length === 0) {
      return;
    }

    // amCharts mutates the DOM heavily; keep it out of Angular's zone.
    this.zone.runOutsideAngular(() => {
      const root = am5.Root.new(this.chartDiv().nativeElement);
      this.root = root;
      root.setThemes([am5themes_Animated.new(root)]);

      const stockChart = root.container.children.push(am5stock.StockChart.new(root, {}));

      // --- Price panel -------------------------------------------------------
      const mainPanel = stockChart.panels.push(
        am5stock.StockPanel.new(root, { wheelY: 'zoomX', panX: true, panY: false }),
      );

      const valueAxis = mainPanel.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' }),
          numberFormat: "'$'#,##0.00",
          extraTooltipPrecision: 2,
        }),
      );

      const dateAxis = mainPanel.xAxes.push(
        am5xy.GaplessDateAxis.new(root, {
          baseInterval: { timeUnit: 'day', count: 1 },
          renderer: am5xy.AxisRendererX.new(root, {}),
        }),
      );

      const valueSeries = mainPanel.series.push(
        am5xy.LineSeries.new(root, {
          name: stock.symbol,
          valueXField: 'date',
          valueYField: 'close',
          xAxis: dateAxis,
          yAxis: valueAxis,
          stroke: am5.color(SERIES_COLOR),
          fill: am5.color(SERIES_COLOR),
          legendValueText: "${valueY}",
          tooltip: am5.Tooltip.new(root, { labelText: "{name}: ${valueY}" }),
        }),
      );
      stockChart.set('stockSeries', valueSeries);

      const legend = mainPanel.plotContainer.children.push(
        am5stock.StockLegend.new(root, { stockChart }),
      );
      legend.data.setAll([valueSeries]);

      this.addDividendBullets(root, valueSeries);

      // --- Volume panel ------------------------------------------------------
      const volumePanel = stockChart.panels.push(
        am5stock.StockPanel.new(root, { wheelY: 'zoomX', panX: true, panY: false, height: am5.percent(30) }),
      );
      volumePanel.panelControls.closeButton.set('forceHidden', true);

      const volumeValueAxis = volumePanel.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' }),
          numberFormat: '#.0a',
        }),
      );

      const volumeDateAxis = volumePanel.xAxes.push(
        am5xy.GaplessDateAxis.new(root, {
          baseInterval: { timeUnit: 'day', count: 1 },
          renderer: am5xy.AxisRendererX.new(root, {}),
        }),
      );

      const volumeSeries = volumePanel.series.push(
        am5xy.ColumnSeries.new(root, {
          name: 'Volume',
          valueXField: 'date',
          valueYField: 'volume',
          xAxis: volumeDateAxis,
          yAxis: volumeValueAxis,
          fill: am5.color(SERIES_COLOR),
          tooltip: am5.Tooltip.new(root, { labelText: '{name}: {valueY}' }),
        }),
      );
      stockChart.set('volumeSeries', volumeSeries);

      const volumeLegend = volumePanel.plotContainer.children.push(
        am5stock.StockLegend.new(root, { stockChart }),
      );
      volumeLegend.data.setAll([volumeSeries]);

      // --- Trendline (period start -> latest close, colored by direction) ----
      const trendSeries = mainPanel.series.push(
        am5xy.LineSeries.new(root, {
          name: 'Trend',
          valueXField: 'date',
          valueYField: 'close',
          xAxis: dateAxis,
          yAxis: valueAxis,
          stroke: am5.color(UP_COLOR),
        }),
      );
      trendSeries.strokes.template.setAll({ strokeWidth: 1 });
      trendSeries.hide(); // shown once data ranges are known

      valueSeries.data.setAll(data);
      volumeSeries.data.setAll(data);

      const updateTrend = () => this.updateTrendline(stock.priceHistory, dateAxis, trendSeries);
      dateAxis.onPrivate('selectionMin', updateTrend);
      dateAxis.onPrivate('selectionMax', updateTrend);

      // --- Period selector toolbar ------------------------------------------
      am5stock.StockToolbar.new(root, {
        container: this.toolbarDiv().nativeElement,
        stockChart,
        controls: [
          am5stock.PeriodSelector.new(root, {
            stockChart,
            hideLongPeriods: true,
            periods: [
              { timeUnit: 'day', count: 7, name: '1 week' },
              { timeUnit: 'day', count: 14, name: '2 weeks' },
              { timeUnit: 'month', count: 1, name: '1 month' },
              { timeUnit: 'year', count: 1, name: '1 year' },
              { timeUnit: 'year', count: 5, name: '5 years' },
              { timeUnit: 'max', name: 'All' },
            ],
          }),
        ],
      });

      // Default to the most recent week, matching the original chart.
      valueSeries.events.once('datavalidated', () => {
        const last = data[data.length - 1].date;
        const weekAgo = last - 7 * 24 * 3600 * 1000;
        dateAxis.zoomToDates(new Date(weekAgo), new Date(last));
      });
    });
  }

  // Add "D" bullets with a tooltip for each price point that paid a dividend.
  private addDividendBullets(root: am5.Root, series: am5xy.LineSeries): void {
    series.bullets.push((_root, _series, dataItem) => {
      const context = dataItem.dataContext as PriceData;
      if (!context.dividend) {
        return undefined;
      }
      return am5.Bullet.new(root, {
        sprite: am5.Label.new(root, {
          text: 'D',
          fill: am5.color(0xffffff),
          background: am5.Circle.new(root, { radius: 7, fill: am5.color(SERIES_COLOR) }),
          centerX: am5.p50,
          centerY: am5.p50,
          fontSize: 10,
          tooltipText: `Dividend: $${context.dividend.toFixed(2)}`,
        }),
      });
    });
  }

  // Draw a trendline from the visible range's starting close to the latest close.
  private updateTrendline(
    history: PriceData[],
    dateAxis: am5xy.DateAxis<am5xy.AxisRenderer>,
    trendSeries: am5xy.LineSeries,
  ): void {
    if (history.length === 0) {
      return;
    }

    const startTime = dateAxis.getPrivate('selectionMin') ?? dateAxis.getPrivate('min');
    if (startTime == null) {
      return;
    }

    const startPoint =
      history.find((point) => point.date.getTime() >= startTime) ?? history[0];
    const endPoint = history[history.length - 1];

    const color = endPoint.close > startPoint.close ? UP_COLOR : DOWN_COLOR;
    trendSeries.set('stroke', am5.color(color));
    trendSeries.data.setAll([
      { date: startPoint.date.getTime(), close: startPoint.close },
      { date: endPoint.date.getTime(), close: endPoint.close },
    ]);
    trendSeries.show();
  }
}
