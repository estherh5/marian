// Typed bridge to the vendored vanilla fleet kit (src/fleet/, byte-identical
// to crystalprism.io/fleet-menu.js). The kit is an IIFE that sets
// window.FleetKit; importing it for side effects puts it in the bundle and
// in the unit-test build alike.
import '../fleet/fleet-menu.js';
import fallback from '../fleet/fleet-fallback.json';

export interface FleetEntry {
  key: string;
  name: string;
  url: string;
  icon: string;
  tagline: string;
  status: string;
  current?: boolean;
}

export interface FleetMenuHandle {
  setApps(apps: FleetEntry[]): void;
  close(): void;
}

interface FleetKitApi {
  shapeFleet(raw: unknown, currentKey: string, fallback?: unknown): FleetEntry[];
  getFleetApps(currentKey: string, opts?: { url?: string; fallback?: unknown }): Promise<FleetEntry[]>;
  mountMenu(
    container: HTMLElement,
    opts: { apps: FleetEntry[]; user: null; rows: never[]; placement: 'down-end' | 'up-start' },
  ): FleetMenuHandle;
  renderFooter(parent: HTMLElement): HTMLElement;
}

export const FLEET_KEY = 'marian';
export const FLEET_FALLBACK: unknown = fallback;
export const fleetKit = (): FleetKitApi => (window as unknown as { FleetKit: FleetKitApi }).FleetKit;
