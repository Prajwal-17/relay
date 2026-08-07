// @vitest-environment jsdom

import { matchRoutes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { router } from "./routes";

describe("billing routes", () => {
  it.each(["/billing/234234", "/billing/esta", "/billing/sales/slsdf234"])(
    "matches the billing not-found route for %s",
    (pathname) => {
      const matches = matchRoutes(router.routes, pathname);

      expect(matches?.map((match) => match.route.path)).toEqual(["/", "billing/*", "*"]);
    }
  );
});
