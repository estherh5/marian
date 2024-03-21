import { Component, OnInit, Input } from '@angular/core';

import { Company } from '../../company';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {
  @Input() company: Company;

  constructor() { }

  ngOnInit(): void { }

  toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  }
}
