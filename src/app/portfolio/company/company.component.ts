import { Component, computed, input } from '@angular/core';

import { Company } from '../../company';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css'],
})
export class CompanyComponent {
  readonly company = input.required<Company>();

  // Finnhub gives market cap in millions; show it as $3.21T, $412.5B, $870M.
  readonly marketCap = computed(() => {
    const millions = this.company().marketCapitalization;
    if (!millions) {
      return '';
    }
    const prefix = this.company().currency === 'USD' || !this.company().currency ? '$' : `${this.company().currency} `;
    if (millions >= 1e6) {
      return `${prefix}${(millions / 1e6).toFixed(2)}T`;
    }
    if (millions >= 1e3) {
      return `${prefix}${(millions / 1e3).toFixed(1)}B`;
    }
    return `${prefix}${Math.round(millions)}M`;
  });

  readonly ipoYear = computed(() => this.company().ipo?.slice(0, 4) ?? '');

  // The website's bare host, e.g. apple.com.
  readonly host = computed(() => {
    try {
      return new URL(this.company().weburl ?? '').hostname.replace(/^www\./, '');
    } catch {
      return this.company().weburl ?? '';
    }
  });
}
