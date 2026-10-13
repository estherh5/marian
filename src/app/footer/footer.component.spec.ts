import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the fleet kit footer exactly once, with the current year', () => {
    const footers = root.querySelectorAll('footer.fleet-footer');
    expect(footers.length).toBe(1);
    const links = Array.from(footers[0].querySelectorAll('a'));
    expect(links.map((a) => a.textContent)).toEqual([
      `© 2017–${new Date().getFullYear()} Crystal Prism`,
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://crystalprism.io',
    ]);
  });

  it('has no All apps link or separator', () => {
    const footer = root.querySelector('footer.fleet-footer')!;
    expect(footer.textContent).not.toContain('All apps');
    expect(footer.querySelector('a[href="https://crystalprism.io/#projects"]')).toBeNull();
    expect(footer.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('drops the old copyright line', () => {
    expect(root.textContent).not.toContain('© Copyright');
  });

  it('keeps the Alpha Vantage, Finnhub and Algolia credits', () => {
    const hrefs = Array.from(root.querySelectorAll('.credits a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['https://www.alphavantage.co/', 'https://finnhub.io/', 'https://www.algolia.com/']);
  });

  it('sets every credit link on the white plate, not the bare background', () => {
    const links = Array.from(root.querySelectorAll('.credits a'));
    expect(links.length).toBe(3);
    expect(links.every((a) => a.closest('.credits-plate'))).toBe(true);
  });
});
