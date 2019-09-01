import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule }    from '@angular/common/http';
import { AmChartsModule } from "@amcharts/amcharts3-angular";

import { AppComponent } from './app.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { SearchComponent } from './search/search.component';
import { ChartComponent } from './portfolio/chart/chart.component';
import { NewsComponent } from './portfolio/news/news.component';
import { CompanyComponent } from './portfolio/company/company.component';
import { CalculatorComponent } from
  './portfolio/calculator/calculator.component';
import { NetChartComponent } from './net-chart/net-chart.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';

@NgModule({
  declarations: [
    AppComponent,
    PortfolioComponent,
    SearchComponent,
    ChartComponent,
    NewsComponent,
    CompanyComponent,
    CalculatorComponent,
    NetChartComponent,
    FooterComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AmChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
