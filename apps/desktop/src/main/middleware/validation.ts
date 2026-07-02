import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

// ref - https://medium.com/@hustlehammer/hono-zod-an-unstoppable-force-83699c682fb4
export const validateRequest = <Target extends keyof ValidationTargets, T extends ZodType>(
  target: Target,
  schema: T
) => {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));
      return c.json(
        {
          error: errors
        },
        400
      );
    }
    return;
  });
};
