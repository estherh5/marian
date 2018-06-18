import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetChartComponent } from './net-chart.component';

describe('NetChartComponent', () => {
  let component: NetChartComponent;
  let fixture: ComponentFixture<NetChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
