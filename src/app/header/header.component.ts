import { Component, HostListener, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() isLandingPage: boolean;

  siteMenuOpen: boolean = false;

  projects: Array<object> = [
    {link: 'https://crystalprism.io/', title: 'Home',
      favicon: 'https://crystalprism.io/favicon.ico'},
    {link: 'https://crystalprism.io/timespace/', title: 'Timespace',
      favicon: 'https://crystalprism.io/timespace/favicon.ico'},
    {link: 'https://crystalprism.io/shapes-in-rain/',
      title: 'Shapes in Rain',
      favicon: 'https://crystalprism.io/shapes-in-rain/favicon.ico'},
    {link: 'https://crystalprism.io/rhythm-of-life/',
      title: 'Rhythm of Life',
      favicon: 'https://crystalprism.io/rhythm-of-life/favicon.ico'},
    {link: 'https://crystalprism.io/canvashare/', title: 'CanvaShare',
      favicon: 'https://crystalprism.io/canvashare/favicon.ico'},
    {link: 'https://crystalprism.io/thought-writer/',
      title: 'Thought Writer',
      favicon: 'https://crystalprism.io/thought-writer/favicon.ico'},
    {link: 'https://crystalprism.io/vicarious/', title: 'Vicarious',
      favicon: 'https://crystalprism.io/vicarious/favicon.ico'},
    {link: 'https://hn-stats.crystalprism.io/', title: 'Hacker News Stats',
      favicon: 'https://hn-stats.crystalprism.io/favicon.ico'},
    {link: 'https://pause.crystalprism.io/', title: 'Pause',
      favicon: 'https://pause.crystalprism.io/favicon.ico'},
    {link: 'https://marian.crystalprism.io/', title: 'Marian',
      favicon: 'https://marian.crystalprism.io/favicon.ico'},
    {link: 'https://vroom.crystalprism.io/', title: 'Vroom',
      favicon: 'https://vroom.crystalprism.io/favicon.ico'},
    {link: 'https://crystalprism.io/user/sign-in/', title: 'Account',
      favicon: 'https://crystalprism.io/favicon.ico'}
  ];

  constructor() { }

  ngOnInit(): void { }

  @HostListener('document:click', ['$event']) clickout(event) {
    const siteMenuIcon = document.getElementById('site-menu-icon');
    const siteMenu = document.getElementById('site-menu');

    if (siteMenuIcon === event.target) {
      return;
    }

    if (this.siteMenuOpen && !siteMenu.contains(event.target)) {
      this.siteMenuOpen = false;
    }
  }

  goToProject($event: Event): void {
    // If event target not an HTMLButtonElement, exit
    if (!($event.target instanceof HTMLElement)) {
      return;
    }

    // Set window location as button link
    const win: Window = window;
    win.location.href = $event.target.dataset.link;
    return;
  }
}
