/**
 * Optional Sentry error reporting for the static site.
 *
 * Next.js runs this file in the browser before the page becomes interactive.
 * Next.js inlines `NEXT_PUBLIC_*` values at build time. A build without
 * `NEXT_PUBLIC_SENTRY_DSN` never loads the Sentry chunk and sends no request
 * to Sentry.
 *
 * With a DSN, the site reports uncaught errors and unhandled promise
 * rejections. It sends no session per page view, no user data, no cookies, no
 * headers, no bodies and no query strings. Tracing and Session Replay stay off.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn?.startsWith("https://")) {
  void import("@sentry/browser").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
      // SDK v11 replaces sendDefaultPii with dataCollection.
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
      },
      // BrowserSession sends one session per page load, which works like page-view analytics.
      integrations: (defaults) => defaults.filter((integration) => integration.name !== "BrowserSession"),
    });
  });
}
