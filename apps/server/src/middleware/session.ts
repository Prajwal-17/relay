import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../app-env";
import { createAuth } from "../auth";

export const requireSession = createMiddleware<AppEnv>(async (context, next) => {
  const session = await createAuth(context.env).api.getSession({
    headers: context.req.raw.headers
  });

  if (!session) throw new HTTPException(401, { message: "Sign in to continue." });

  context.set("userId", session.user.id);
  context.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image
  });
  await next();
});
