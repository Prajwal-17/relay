<!-- impeccable:product-schema 1 -->

# Relay Mobile Product Contract

## Platform

adaptive

## Primary users

Relay Mobile serves shop owners and counter staff who use an Android phone or iPhone throughout the business day. They need to record and verify daily money movement quickly, often while serving customers or reconciling the counter.

## Purpose

Relay Mobile is the authenticated companion for Relay's daily Money workflow. Its primary job is to make received payments and vendor payments fast to record, easy to verify, and difficult to duplicate or lose. Money is the default and only live operational workflow today. The bottom navigation exposes Home, Products, Money, Customers, and Account. Home, Products, and Customers show only their title, icon, and “Coming soon”; there is no sample dashboard or fake business data. Account contains Google identity, email, and sign-out. Money opens dedicated received/vendor entry screens, with separate history and vendor details screens. Its month-only header leads a flat, swipeable business week.

## Context of use

- Repeated, short sessions at a busy retail counter.
- One-handed phone use is common; key actions must stay within comfortable reach.
- Users scan rupee values, payment methods, dates, and save state before reading supporting text.
- Connectivity may be intermittent. Cached information can remain readable while mutations clearly pause offline.
- Android and iOS are primary targets, including narrow devices, software keyboards, native sheets, and system safe areas.

## Durable product constraints

- Money values are integer paisa in storage and transit and are formatted through shared rupee utilities.
- Business dates use Asia/Kolkata and future dates cannot be selected or submitted. Today refreshes on resume and across midnight; all entry timestamps use AM/PM IST.
- New receipts use Cash (null method ID), PhonePe, or Paytm with user-owned API IDs. Earlier provider IDs, receipt names, history, and totals remain intact.
- Authentication uses Google through Better Auth; session restoration finishes before protected routes render.
- TanStack Query owns server state. A mutation remains visibly pending at its initiating control until the request and required cache synchronization have definitively succeeded or failed.
- Dismissal, navigation, and confirmation feedback occur from the same resolved mutation outcome. Haptics are limited to completed deletions. Duplicate submissions stay locked throughout that lifecycle.
- Offline, loading, empty, success, error, destructive, long-name, long-note, and large-value states are first-class product states.
- Home, Products, and Customers must not imply functionality that does not exist.
- The mobile application has no local business database and does not import desktop data.

## Brand and visual inheritance

- Product name: Relay.
- Preserve the Relay Continuum identity and use the same semantic palette as Relay Desktop across every mobile direction: warm canvas, white working surfaces, charcoal primary actions, terracotta focus and counter cues, teal received-money cues, and the established neutral border ramp.
- Mobile uses native-safe hexadecimal sRGB values mapped directly from Relay Desktop's approved OKLCH roles. Visual directions may change composition and material character, but may not introduce a competing palette.
- Existing identity assets live in `apps/mobile/assets/images/` and payment marks in `apps/mobile/assets/payment-methods/`.
- Inter remains the primary operational typeface.
- Confirmed mobile direction: Quick Ledger uses Relay’s existing semantic palette and Inter, with a Sunday-first business week, framed Cash/PhonePe/Paytm compartments, and fixed recording actions above the five-tab navigation. Earlier methods remain visible in history and day totals.

## Product principles

1. **State before decoration.** Every action communicates ready, pressed, pending, success, failure, and offline behavior at the point of interaction.
2. **Money at a glance.** Dates, totals, method balances, and vendor payments form an obvious reading order with tabular financial numerals.
3. **Fast, safe entry.** Common add flows minimize travel and ambiguity while preventing duplicate submissions and accidental dismissal.
4. **Native confidence.** Navigation, sheets, keyboards, safe areas, haptics, and accessibility follow platform expectations without splitting the product into unrelated iOS and Android designs.
5. **Honest scope.** Unavailable areas are clear, useful placeholders and never masquerade as complete workflows.

## Accessibility baseline

- Meet WCAG AA contrast for text, meaningful icons, focus indicators, and control boundaries.
- Maintain 48px ordinary touch targets and avoid color-only state communication. The dense calendar grid may use 44px-wide cells at a 320px viewport; its cell height remains at least 48px.
- Support screen-reader labels, selected/busy/disabled state, dynamic content announcements, keyboard avoidance, and readable text scaling.
- Motion is functional feedback; deletion haptics supplement the visible result.

## Evidence

- User confirmation on 26 September 2026: the primary users are shop owners/counter staff on Android and iOS; Money is the only live workflow; Home, Products, and Customers remain placeholders.
- User confirmation on 4 October 2026: remove demo and unused screen code, open Money by default, and expose the other tab icons with simple “Coming soon” screens.
- `README.md`
- `apps/mobile/README.md`
- `apps/mobile/src/features/money/`
- `apps/mobile/src/features/auth/sign-in-screen.tsx`
- `apps/mobile/src/features/profile/profile-screen.tsx`
- `apps/mobile/src/app/(tabs)/_layout.tsx`
