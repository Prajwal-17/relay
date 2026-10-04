import assert from "node:assert/strict";
import test from "node:test";
import { drawerDragTranslation, shouldDismissDrawer } from "../src/lib/animations/drawer-motion.ts";

test("short pulls return while deliberate downward pulls and flicks dismiss", () => {
  assert.equal(shouldDismissDrawer(50, 0, 480), false);
  assert.equal(shouldDismissDrawer(120, 0, 480), true);
  assert.equal(shouldDismissDrawer(24, 850, 480), true);
  assert.equal(shouldDismissDrawer(5, 1200, 480), false);
});

test("reversing upward keeps the drawer open even past the distance threshold", () => {
  assert.equal(shouldDismissDrawer(160, -600, 480), false);
  assert.equal(shouldDismissDrawer(-30, 900, 480), false);
});

test("dismiss distance adapts to small sheets and stays reachable for tall sheets", () => {
  assert.equal(shouldDismissDrawer(72, 0, 240), true);
  assert.equal(shouldDismissDrawer(120, 0, 900), true);
});

test("downward dragging tracks the finger and upward travel has bounded resistance", () => {
  assert.equal(drawerDragTranslation(125), 125);
  assert.equal(drawerDragTranslation(0), 0);
  assert.ok(drawerDragTranslation(-20) < 0);
  assert.ok(drawerDragTranslation(-20) > -20);
  assert.ok(drawerDragTranslation(-2000) >= -12);
});
