/** Keep short pulls reversible; a deliberate downward flick can dismiss sooner. */
export function shouldDismissDrawer(distance: number, velocity: number, height: number) {
  "worklet";
  if (velocity < -500) return false;
  const threshold = Math.min(120, Math.max(72, height * 0.25));
  return distance >= threshold || (distance >= 20 && velocity >= 800);
}

export function drawerDragTranslation(distance: number) {
  "worklet";
  return distance >= 0 ? distance : -12 * (1 - Math.exp(distance / 60));
}
