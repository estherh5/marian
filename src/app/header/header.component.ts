import { Component, HostListener, input } from '@angular/core';
import { NgClass } from '@angular/common';

interface Project {
  link: string;
  title: string;
  favicon: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [NgClass],
})
export class HeaderComponent {
  readonly isLandingPage = input.required<boolean>();

  siteMenuOpen = false;

  readonly projects: Project[] = [
    { link: 'https://crystalprism.io/', title: 'Home', favicon: 'https://crystalprism.io/favicon.ico' },
    {
      link: 'https://timespace.crystalprism.io/',
      title: 'Timespace',
      favicon: 'https://timespace.crystalprism.io/favicon.ico',
    },
    {
      link: 'https://shapes-in-rain.crystalprism.io/',
      title: 'Shapes in Rain',
      favicon: 'https://shapes-in-rain.crystalprism.io/favicon.ico',
    },
    {
      link: 'https://rhythm-of-life.crystalprism.io/',
      title: 'Rhythm of Life',
      favicon: 'https://rhythm-of-life.crystalprism.io/favicon.ico',
    },
    {
      link: 'https://canvashare.crystalprism.io/',
      title: 'CanvaShare',
      favicon: 'https://canvashare.crystalprism.io/favicon.ico',
    },
    {
      link: 'https://thought-writer.crystalprism.io/',
      title: 'Thought Writer',
      favicon: 'https://thought-writer.crystalprism.io/favicon.ico',
    },
    {
      link: 'https://vicarious.crystalprism.io/',
      title: 'Vicarious',
      favicon: 'https://vicarious.crystalprism.io/favicon.ico',
    },
    {
      link: 'https://hn-stats.crystalprism.io/',
      title: 'Hacker News Stats',
      favicon: 'https://hn-stats.crystalprism.io/favicon.ico',
    },
    { link: 'https://pause.crystalprism.io/', title: 'Pause', favicon: 'https://pause.crystalprism.io/favicon.ico' },
    {
      link: 'https://marian.crystalprism.io/',
      title: 'Marian',
      favicon: 'https://marian.crystalprism.io/favicon.ico',
    },
    { link: 'https://vroom.crystalprism.io/', title: 'Vroom', favicon: 'https://vroom.crystalprism.io/favicon.ico' },
    {
      link: 'https://account.crystalprism.io/sign-in/',
      title: 'Account',
      favicon: 'https://crystalprism.io/favicon.ico',
    },
  ];

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent): void {
    const siteMenuIcon = document.getElementById('site-menu-icon');
    const siteMenu = document.getElementById('site-menu');
    const target = event.target as Node;

    if (siteMenuIcon === target) {
      return;
    }

    if (this.siteMenuOpen && siteMenu && !siteMenu.contains(target)) {
      this.siteMenuOpen = false;
    }
  }

  goToProject(event: Event): void {
    // If event target is not an HTML element, exit.
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    // Navigate to the project link stored on the clicked element.
    const link = event.target.dataset.link;
    if (link) {
      window.location.href = link;
    }
  }
}
