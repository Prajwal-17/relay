<!-- impeccable:product-schema 1 -->

# Relay Mobile Product Contract

## Platform

adaptive

## Primary users

Relay Mobile serves shop owners and counter staff who use an Android phone or iPhone throughout the business day. They need to record and verify daily money movement quickly, often while serving customers or reconciling the counter.

## Purpose

Relay Mobile is the authenticated companion for Relay's daily Money workflow. Its primary job is to make received payments and vendor payments fast to record, easy to verify, and difficult to duplicate or lose. Money is the only live operational workflow today. Home, Products, and Customers remain honest placeholders until those workflows are implemented; Profile contains account identity and sign-out.

## Context of use

- Repeated, short sessions at a busy retail counter.
- One-handed phone use is common; key actions must stay within comfortable reach.
- Users scan rupee values, payment methods, dates, and save state before reading supporting text.
- Connectivity may be intermittent. Cached information can remain readable while mutations clearly pause offline.
- Android and iOS are primary targets, including narrow devices, software keyboards, native sheets, and system safe areas.

## Durable product constraints

- Money values are integer paisa in storage and transit and are formatted through shared rupee utilities.
- Business dates use Asia/Kolkata and future dates cannot be selected or submitted.
- Authentication uses Google through Better Auth; session restoration finishes before protected routes render.
- TanStack Query owns server state. A mutation remains visibly pending at its initiating control until the request and required cache synchronization have definitively succeeded or failed.
- Success haptics, dismissal, navigation, and confirmation feedback occur from the same resolved mutation outcome. Duplicate submissions stay locked throughout that lifecycle.
- Offline, loading, empty, success, error, destructive, long-name, long-note, and large-value states are first-class product states.
- Home, Products, and Customers must not imply functionality that does not exist.
- The mobile application has no local business database and does not import desktop data.

## Brand and visual inheritance

- Product name: Relay.
- Preserve the Relay Continuum identity and use the same semantic palette as Relay Desktop across every mobile direction: warm canvas, white working surfaces, charcoal primary actions, terracotta focus and counter cues, teal received-money cues, and the established neutral border ramp.
- Mobile uses native-safe hexadecimal sRGB values mapped directly from Relay Desktop's approved OKLCH roles. Visual directions may change composition and material character, but may not introduce a competing palette.
- Existing identity assets live in `apps/mobile/assets/images/` and payment marks in `apps/mobile/assets/payment-methods/`.
- Inter remains the primary operational typeface.
- Confirmed mobile direction: Counter Cashbox governs the visual world and operational state language; the bottom navigation uses the restrained Material Ledger treatment with a white shelf, compact selected container, and terracotta active icon and label.

## Product principles

1. **State before decoration.** Every action communicates ready, pressed, pending, success, failure, and offline behavior at the point of interaction.
2. **Money at a glance.** Dates, totals, method balances, and vendor payments form an obvious reading order with tabular financial numerals.
3. **Fast, safe entry.** Common add flows minimize travel and ambiguity while preventing duplicate submissions and accidental dismissal.
4. **Native confidence.** Navigation, sheets, keyboards, safe areas, haptics, and accessibility follow platform expectations without splitting the product into unrelated iOS and Android designs.
5. **Honest scope.** Unavailable areas are clear, useful placeholders and never masquerade as complete workflows.

## Accessibility baseline

- Meet WCAG AA contrast for text, meaningful icons, focus indicators, and control boundaries.
- Maintain at least 44×44 point touch targets and avoid color-only state communication.
- Support screen-reader labels, selected/busy/disabled state, dynamic content announcements, keyboard avoidance, and readable text scaling.
- Motion and haptics are functional feedback, not the sole indication of completion.

## Evidence

- User confirmation on 26 September 2026: the primary users are shop owners/counter staff on Android and iOS; Money is the only live workflow; Home, Products, and Customers remain placeholders.
- `README.md`
- `apps/mobile/README.md`
- `apps/mobile/src/features/money/`
- `apps/mobile/src/features/auth/sign-in-screen.tsx`
- `apps/mobile/src/features/profile/profile-screen.tsx`
- `apps/mobile/src/app/(tabs)/_layout.tsx`
