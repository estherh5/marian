import { AfterViewInit, Component, ElementRef, OnDestroy, input, viewChild } from '@angular/core';
import { FLEET_FALLBACK, FLEET_KEY, FleetMenuHandle, fleetKit } from '../fleet';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  readonly isLandingPage = input.required<boolean>();
  private readonly fleetMount = viewChild.required<ElementRef<HTMLElement>>('fleetMount');
  private menu: FleetMenuHandle | null = null;

  ngAfterViewInit(): void {
    const kit = fleetKit();
    const menu = kit.mountMenu(this.fleetMount().nativeElement, {
      apps: kit.shapeFleet(null, FLEET_KEY, FLEET_FALLBACK),
      user: null,
      rows: [],
      placement: 'down-end',
    });
    this.menu = menu;
    kit.getFleetApps(FLEET_KEY, { fallback: FLEET_FALLBACK }).then((apps) => {
      if (this.menu === menu) menu.setApps(apps);
    });
  }

  ngOnDestroy(): void {
    this.menu?.close();
    this.menu = null;
  }
}
