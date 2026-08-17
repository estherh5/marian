import { ErrorHandler, Injectable } from "@angular/core";
import { reportError } from "./flare";

// PORTED from flare/reporters/next/app/global-error.tsx's reporting call.
// Angular's own hook for "every uncaught error in the app" is ErrorHandler,
// registered in app.config.ts as `{ provide: ErrorHandler, useClass:
// FlareErrorHandler }`. app.config.ts also calls
// provideBrowserGlobalErrorListeners(), which forwards window `error` and
// `unhandledrejection` events into this same handler — so this one override
// covers render-time errors AND window-level ones. No separate window
// listeners here: adding them would double-report every window-level error.
@Injectable()
export class FlareErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    void reportError(error, {
      kind: "client",
      url: typeof window !== "undefined" ? window.location.pathname : null,
    });
    // Preserve Angular's default behavior (its own ErrorHandler.handleError
    // just does this) so wiring in a reporter doesn't silence console output
    // that local dev and other tooling still rely on.
    console.error(error);
  }
}
