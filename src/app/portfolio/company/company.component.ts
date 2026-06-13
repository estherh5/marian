import { Component, input } from '@angular/core';

import { Company } from '../../company';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css'],
})
export class CompanyComponent {
  readonly company = input.required<Company>();

  toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }
}
