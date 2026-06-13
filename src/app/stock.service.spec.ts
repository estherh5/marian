import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { StockService } from './stock.service';

describe('StockService', () => {
  let service: StockService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StockService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requests the company overview from the proxy', () => {
    service.getCompanyData('AAPL').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/company');
    expect(req.request.params.get('symbol')).toBe('AAPL');
    req.flush({});
  });

  it('requests the current quote from the proxy', () => {
    service.getCurrentPrice('AAPL').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/quote');
    expect(req.request.params.get('symbol')).toBe('AAPL');
    req.flush({ c: 1, d: 0, dp: 0, h: 1, l: 1, o: 1, pc: 1, t: 0 });
  });

  it('requests daily history from the proxy', () => {
    service.getDailyData('AAPL').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/daily');
    expect(req.request.params.get('symbol')).toBe('AAPL');
    req.flush({});
  });

  it('requests company news from the proxy', () => {
    service.getStockNews('AAPL').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/news');
    expect(req.request.params.get('symbol')).toBe('AAPL');
    req.flush([]);
  });
});
