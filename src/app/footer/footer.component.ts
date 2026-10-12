import { AfterViewInit, Component, ElementRef, viewChild } from '@angular/core';
import { fleetKit } from '../fleet';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent implements AfterViewInit {
  private readonly fleetFooter = viewChild.required<ElementRef<HTMLElement>>('fleetFooter');

  ngAfterViewInit(): void {
    fleetKit().renderFooter(this.fleetFooter().nativeElement);
  }
}
