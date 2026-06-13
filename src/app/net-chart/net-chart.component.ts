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

import { PriceData } from '../pricedata';
import { Stock } from '../stock';

type AxisType = 'percent' | 'price';

interface NetPoint {
  date: number;
  value: number;
}

interface NetSeries {
  title: string;
  color: number;
  points: NetPoint[];
}

const COLORS = [
  0xfcd202, 0x0d8ecf, 0x2a0cd0, 0xcd0d74, 0xcc0000, 0x00cc00, 0x0000cc, 0xdddddd, 0x999999, 0x333333,
  0x990000,
];
const NET_COLOR = 0x05d405;

@Component({
  selector: 'app-net-chart',
  templateUrl: './net-chart.component.html',
  styleUrls: ['./net-chart.component.css'],
})
export class NetChartComponent implements AfterViewInit, DoCheck, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly selectedStocks = input.required<Stock[]>();
  readonly update = input.required<boolean>();

  readonly chartUpdated = output<void>();
  readonly optionUpdated = output<void>();

  readonly chartDiv = viewChild.required<ElementRef<HTMLElement>>('chartdiv');
  readonly toolbarDiv = viewChild.required<ElementRef<HTMLElement>>('toolbar');

  buttonText = 'Toggle $';

  private type: AxisType = 'percent';
  private root?: am5.Root;
  private built = false;
  private disposed = false;

  ngAfterViewInit(): void {
    this.build();
  }

  // Rebuild the chart when the parent sets the update flag after the first build.
  ngDoCheck(): void {
    if (this.built && this.update()) {
      this.build();
      this.chartUpdated.emit();
    }
  }

  ngOnDestroy(): void {
    this.disposed = true;
    this.disposeChart();
  }

  private build(): void {
    this.built = true;
    this.disposeChart();
    // Defer one frame so the container is laid out before amCharts measures it.
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        if (!this.disposed) {
          this.createChart();
        }
      });
    });
  }

  // Toggle the net equity chart's y-axis between % and $ units.
  toggleAxis(): void {
    if (this.type === 'percent') {
      this.type = 'price';
      this.buttonText = 'Toggle %';
    } else {
      this.type = 'percent';
      this.buttonText = 'Toggle $';
    }

    // Trigger an update of the net equity chart through the parent.
    this.optionUpdated.emit();
  }

  private disposeChart(): void {
    this.root?.dispose();
    this.root = undefined;
  }

  /* Compute net equity for each stock (and the combined "Net" line) at every
  price point. The math mirrors the original chart: dividends fold into close
  price, each share contributes (close - cost) * shares, and percent is net
  equity over the amount invested. */
  private computeSeries(): { series: NetSeries[]; net: NetPoint[] | null } {
    const isPercent = this.type === 'percent';
    let stocks = structuredClone(this.selectedStocks());

    // Keep only valid, complete shares and sort each stock's shares by date.
    stocks.forEach((stock) => {
      stock.shares = stock.shares.filter(
        (share) =>
          !share.dateError &&
          !share.numberError &&
          !share.priceError &&
          share.date &&
          share.number &&
          (share.price || share.price === 0),
      );
      stock.shares.sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());
    });

    // Drop stocks without shares, then order stocks by their oldest share date.
    stocks = stocks.filter((stock) => stock.shares.length > 0);
    stocks.sort(
      (a, b) => new Date(a.shares[0].date as string).getTime() - new Date(b.shares[0].date as string).getTime(),
    );

    const series: NetSeries[] = [];
    const allPoints: PriceData[] = [];
    const tzOffset = -(new Date().getTimezoneOffset() / 60);

    stocks.forEach((stock, i) => {
      const firstShareTime = new Date(`${stock.shares[0].date} GMT${tzOffset}`).getTime();

      // Limit price history to the oldest share's purchase date onward.
      stock.priceHistory = stock.priceHistory.filter((price) => price.date.getTime() >= firstShareTime);

      // Keep an untouched copy of close prices for later calculations.
      const priceHistoryCopy = structuredClone(stock.priceHistory);
      const points: NetPoint[] = [];

      stock.priceHistory.forEach((price, index) => {
        // Fold any dividend into the close price.
        if (price.dividend !== 0) {
          price.close += price.dividend;
        }

        stock.shares.forEach((share, ind) => {
          const shareCount = share.number ?? 0;
          const sharePrice = share.price ?? 0;
          const shareTime = new Date(`${share.date} GMT${tzOffset}`).getTime();

          if (ind === 0) {
            price.close = price.close * shareCount - sharePrice * shareCount;
            price.shares = shareCount;
            price.invested = sharePrice * shareCount;
            if (isPercent) {
              price.percent = (price.close / price.invested) * 100;
            }
          } else if (price.date.getTime() >= shareTime) {
            price.close += priceHistoryCopy[index].close * shareCount - sharePrice * shareCount;
            price.shares = (price.shares ?? 0) + shareCount;
            price.invested = (price.invested ?? 0) + sharePrice * shareCount;
            if (isPercent) {
              price.percent = (price.close / (price.invested ?? 1)) * 100;
            }
          }
        });

        // Start each stock's net equity at zero.
        if (index === 0) {
          price.close = 0;
          if (isPercent) {
            price.percent = 0;
          }
        }

        points.push({ date: price.date.getTime(), value: isPercent ? (price.percent ?? 0) : price.close });
        allPoints.push(price);
      });

      series.push({ title: stock.symbol, color: COLORS[i % COLORS.length], points });
    });

    // Build a combined "Net" line if the user holds more than one stock.
    let net: NetPoint[] | null = null;
    if (stocks.length > 1) {
      allPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

      const byDate = new Map<number, { close: number; invested: number }>();
      for (const price of allPoints) {
        const key = price.date.getTime();
        const existing = byDate.get(key) ?? { close: 0, invested: 0 };
        existing.close += price.close;
        existing.invested += price.invested ?? 0;
        byDate.set(key, existing);
      }

      net = [...byDate.entries()]
        .sort(([a], [b]) => a - b)
        .map(([date, { close, invested }]) => ({
          date,
          value: isPercent ? (invested ? (close / invested) * 100 : 0) : close,
        }));
    }

    return { series, net };
  }

  private createChart(): void {
    const { series, net } = this.computeSeries();
    if (series.length === 0) {
      return;
    }

    const isPercent = this.type === 'percent';

    this.zone.runOutsideAngular(() => {
      const root = am5.Root.new(this.chartDiv().nativeElement);
      this.root = root;
      root.setThemes([am5themes_Animated.new(root)]);

      const stockChart = root.container.children.push(am5stock.StockChart.new(root, {}));

      const panel = stockChart.panels.push(
        am5stock.StockPanel.new(root, { wheelY: 'zoomX', panX: true, panY: false }),
      );

      const valueAxis = panel.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, { pan: 'zoom' }),
          numberFormat: isPercent ? "#,##0.0'%'" : "'$'#,##0.00",
          extraTooltipPrecision: isPercent ? 1 : 2,
        }),
      );

      const dateAxis = panel.xAxes.push(
        am5xy.GaplessDateAxis.new(root, {
          baseInterval: { timeUnit: 'day', count: 1 },
          renderer: am5xy.AxisRendererX.new(root, {}),
        }),
      );

      const legend = panel.plotContainer.children.push(am5stock.StockLegend.new(root, { stockChart }));
      const tooltipText = isPercent ? "{name}: {valueY.formatNumber('#,##0.0')}%" : '{name}: ${valueY}';

      const addSeries = (def: NetSeries): am5xy.LineSeries => {
        const lineSeries = panel.series.push(
          am5xy.LineSeries.new(root, {
            name: def.title,
            valueXField: 'date',
            valueYField: 'value',
            xAxis: dateAxis,
            yAxis: valueAxis,
            stroke: am5.color(def.color),
            fill: am5.color(def.color),
            legendValueText: isPercent ? "{valueY.formatNumber('#,##0.0')}%" : "${valueY}",
            tooltip: am5.Tooltip.new(root, { labelText: tooltipText }),
          }),
        );
        lineSeries.data.setAll(def.points);
        return lineSeries;
      };

      const firstSeries = addSeries(series[0]);
      stockChart.set('stockSeries', firstSeries);
      for (const def of series.slice(1)) {
        addSeries(def);
      }
      if (net) {
        addSeries({ title: 'Net', color: NET_COLOR, points: net });
      }

      legend.data.setAll(panel.series.values);

      // Period selector toolbar.
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

      firstSeries.events.once('datavalidated', () => {
        const points = series[0].points;
        if (points.length === 0) {
          return;
        }
        const last = points[points.length - 1].date;
        const weekAgo = last - 7 * 24 * 3600 * 1000;
        dateAxis.zoomToDates(new Date(weekAgo), new Date(last));
      });
    });
  }
}
