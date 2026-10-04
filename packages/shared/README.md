# Relay shared utilities

`@relay/shared/date-utils` is the common TypeScript date implementation for desktop, mobile, and
the Money API. It has no native, browser, or server dependencies; app bundlers consume the source.
Electron's main build includes this package rather than externalizing its TypeScript entry.

- Ledger dates are validated `YYYY-MM-DD` calendar values. Day/week/month arithmetic uses UTC
  calendar fields so device timezones and daylight saving changes cannot shift a ledger date.
- Today and timestamp display use `Asia/Kolkata`. Parsing follows the desktop contract: values
  without a timezone are IST; `Z` and explicit offsets preserve their instant. Calendar-only
  values represent midnight in IST. Impossible dates and times return `null` before normalization.
- Desktop Date-object helpers preserve the local wall-clock behavior used by date/time pickers.
- Desktop import paths and mobile date types re-export the shared implementation. Mobile keeps
  uppercase AM/PM presentation without a timezone suffix.

Date regressions run in the mobile utility suite and the desktop date utility suite.
