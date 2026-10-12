import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let root: HTMLElement;

  async function render(isLandingPage: boolean): Promise<void> {
    await TestBed.configureTestingModule({ imports: [HeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('isLandingPage', isLandingPage);
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    fixture?.destroy();
    document.querySelectorAll('.fleet-panel, .fleet-scrim').forEach((n) => n.remove());
  });

  it('mounts one fleet trigger as the last thing in the header, after the title', async () => {
    await render(false);
    const header = root.querySelector('header')!;
    const triggers = header.querySelectorAll('.fleet-trigger');
    expect(triggers.length).toBe(1);
    expect(header.lastElementChild!.contains(triggers[0])).toBe(true);
    expect(header.querySelector('#title')!.textContent!.trim()).toBe('Marian');
    expect(triggers[0].getAttribute('aria-label')).toBe('Apps and sign in');
  });

  it('removes the old site menu', async () => {
    await render(false);
    expect(root.querySelector('#site-menu')).toBeNull();
    expect(root.querySelector('#site-menu-icon')).toBeNull();
  });

  it('hides the title on the landing page but keeps the trigger', async () => {
    await render(true);
    expect(root.querySelector('#title')).toBeNull();
    expect(root.querySelectorAll('.fleet-trigger').length).toBe(1);
  });

  it('opens a panel of fleet apps with Marian current and no account block', async () => {
    await render(false);
    (root.querySelector('.fleet-trigger') as HTMLButtonElement).click();
    const panel = document.querySelector('.fleet-panel')!;
    expect(panel).not.toBeNull();
    expect(panel.querySelector('.fleet-account')).toBeNull();
    const current = panel.querySelectorAll('.fleet-app[aria-current="page"]');
    expect(current.length).toBe(1);
    expect(current[0].textContent).toBe('Marian');
    expect(panel.querySelectorAll('.fleet-app').length).toBeGreaterThan(10);
  });
});
