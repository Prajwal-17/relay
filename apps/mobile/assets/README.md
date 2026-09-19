# Mobile assets

The Relay source artwork lives in the repository’s `assets/mobile/` directory, copied unchanged
from the Relay rebrand on master (fda3276). `images/relay-foreground.png` and
`images/relay-splash.png` are PNG rasterizations of its Android foreground SVG.
`images/relay-icon.png` and `images/relay-favicon.png` are unchanged copies of the source
`icon-1024.png` and `play-store-512.png`. Keep app config image paths inside this app so
Expo Go asset URLs do not contain parent-directory segments.

Official Paytm and PhonePe marks live in [`payment-methods/`](payment-methods/README.md), with
their source and rights status documented beside the assets. Generic methods use Relay's bundled
icon set. All payment marks are local and require no network access.

`fonts/Inter-*.ttf` are static 400/500/600/700 weight instances of the desktop app's bundled
`InterVariable.woff2` (default optical size), generated with fontTools. Both apps use Inter;
the static mobile faces avoid variable-font differences between Android and iOS. Inter is
distributed under the SIL Open Font License; see `fonts/OFL.txt`. Fonts load locally, offline.
