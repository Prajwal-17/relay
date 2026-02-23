import { createMiddleware } from "hono/factory";
import pino from "pino";

const loggerInstance = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname,reqId",
      messageFormat: "{msg}"
    }
  }
});

export const logger = createMiddleware(async (c, next) => {
  const start = Date.now();

  await next();

  const ms = Date.now() - start;

  let pathWithQuery = c.req.path;
  const queryIndex = c.req.url.indexOf("?");
  if (queryIndex !== -1) {
    pathWithQuery += c.req.url.slice(queryIndex);
  }

  const logMessage = `${c.req.method} ${pathWithQuery} ${c.res.status} ${ms}ms`;

  if (c.res.status >= 500) {
    loggerInstance.error(logMessage);
  } else if (c.res.status >= 400) {
    loggerInstance.warn(logMessage);
  } else {
    loggerInstance.info(logMessage);
  }
});
