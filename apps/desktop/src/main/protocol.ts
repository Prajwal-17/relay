import { app, net, protocol } from "electron/main";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validate as isUuid } from "uuid";

const PROTOCOL_NAME = "app-assets";

export function registerProtocol() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PROTOCOL_NAME,
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        corsEnabled: true
      }
    }
  ]);
}

function requestFileName(request: Request) {
  try {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    if (!pathname.startsWith("/") || pathname.indexOf("/", 1) !== -1) return null;
    const fileName = pathname.slice(1);
    return fileName && path.basename(fileName) === fileName ? fileName : null;
  } catch {
    return null;
  }
}

async function serveProductImage(request: Request) {
  const value = requestFileName(request);
  const imageId = value?.endsWith(".webp") ? value.slice(0, -5) : value;
  if (!imageId || !isUuid(imageId)) {
    return new Response("Access denied", { status: 403 });
  }

  const imagePath = path.join(app.getPath("userData"), "product-images", `${imageId}.webp`);
  return net.fetch(pathToFileURL(imagePath).toString());
}

export function handleAssetsProtocol() {
  protocol.handle(PROTOCOL_NAME, (request) => {
    const host = new URL(request.url).host;
    if (host === "product-images") return serveProductImage(request);
    return new Response("Access denied", { status: 403 });
  });
}
