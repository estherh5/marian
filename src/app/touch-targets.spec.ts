import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer/footer.component';
import { NewsComponent } from './portfolio/news/news.component';
import { CompanyComponent } from './portfolio/company/company.component';

/* Text links and chips get a 44px tap band under (pointer: coarse) from an
   absolutely positioned ::after on a relatively positioned host, so the band
   grows the hit area without changing the host's box or the line it sits on. */

interface Decls {
  host: Record<string, string>;
  band: Record<string, string>;
}

function coarseRules(): CSSStyleRule[] {
  const out: CSSStyleRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRule[];
    try {
      rules = Array.from(sheet.cssRules);
    } catch {
      continue;
    }
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule && /pointer:\s*coarse/.test(rule.media.mediaText)) {
        for (const inner of Array.from(rule.cssRules)) {
          if (inner instanceof CSSStyleRule) out.push(inner);
        }
      }
    }
  }
  return out;
}

function decls(rule: CSSStyleRule): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < rule.style.length; i++) {
    const name = rule.style[i];
    result[name] = rule.style.getPropertyValue(name).trim();
  }
  return result;
}

function coarseDecls(el: Element): Decls {
  const host: Record<string, string> = {};
  const band: Record<string, string> = {};
  for (const rule of coarseRules()) {
    for (const part of rule.selectorText.split(',').map((s) => s.trim())) {
      const pseudo = part.match(/::?(after|before)$/);
      const base = pseudo ? part.slice(0, pseudo.index) : part;
      let matches: boolean;
      try {
        matches = el.matches(base);
      } catch {
        matches = false;
      }
      if (!matches) continue;
      Object.assign(pseudo ? band : host, decls(rule));
    }
  }
  return { host, band };
}

function expectTapBand(el: Element): void {
  const { host, band } = coarseDecls(el);
  expect(band['position'], 'band is absolutely positioned').toBe('absolute');
  expect(band['content'], 'band is generated').toBeDefined();
  expect(parseFloat(band['min-height'] ?? band['height'] ?? '0'), 'band is at least 44px tall').toBeGreaterThanOrEqual(44);
  expect(host['position'], 'host anchors the band').toBe('relative');
  // The host's own box is left alone, so nothing around it moves.
  for (const prop of ['min-height', 'height', 'padding', 'padding-top', 'padding-bottom', 'margin', 'margin-top', 'margin-bottom', 'line-height']) {
    expect(host[prop], `host ${prop} is untouched`).toBeUndefined();
  }
}

function render<T>(type: Type<T>, inputs: Record<string, unknown> = {}): HTMLElement {
  const fixture = TestBed.createComponent(type);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('touch targets under (pointer: coarse)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, NewsComponent, CompanyComponent],
    }).compileComponents();
  });

  it('gives every footer credit link a 44px band', () => {
    const root = render(FooterComponent);
    const links = Array.from(root.querySelectorAll('.credits a'));
    expect(links.length).toBe(3);
    links.forEach(expectTapBand);
  });

  it('gives news source links and related chips a 44px band', () => {
    const root = render(NewsComponent, {
      news: [
        {
          category: 'company',
          datetime: Math.floor(Date.now() / 1000) - 3600,
          headline: 'Headline',
          id: 1,
          image: '',
          related: ['AAPL'],
          source: 'Reuters',
          summary: '',
          url: 'https://example.com/a',
        },
      ],
    });
    const source = root.querySelector('.source-name a');
    const chip = root.querySelector('.related');
    expect(source).not.toBeNull();
    expect(chip).not.toBeNull();
    expectTapBand(source!);
    expectTapBand(chip!);
  });

  it('gives the About website link a 44px band', () => {
    const root = render(CompanyComponent, { company: { name: 'Apple', weburl: 'https://www.apple.com/' } });
    const link = root.querySelector('a.website');
    expect(link).not.toBeNull();
    expectTapBand(link!);
  });
});
