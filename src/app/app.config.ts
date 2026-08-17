import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { FlareErrorHandler } from './flare/flare-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    // Forwards window error/unhandledrejection events into ErrorHandler below —
    // do not also add window listeners for flare (see flare-error-handler.ts).
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    { provide: ErrorHandler, useClass: FlareErrorHandler },
  ],
};
