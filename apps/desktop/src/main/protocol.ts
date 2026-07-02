import { app, net, protocol } from "electron/main";
import path from "path";
import { pathToFileURL } from "url";

const protocolName = "app-assets";

export function registerProtocol() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: protocolName,
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        bypassCSP: true,
        corsEnabled: true
      }
    }
  ]);
}

export function handleAssetsProtocol() {
  protocol.handle("app-assets", (request) => {
    //  strip protocol and end trailing slash
    const url = request.url.replace(/^app-assets:\/\//i, "").replace(/\/$/, "");

    const decodedUrl = decodeURIComponent(url);

    const basePath = path.join(app.getPath("userData"), "product-images");
    const absolutePath = path.normalize(path.join(basePath, decodedUrl));

    if (!absolutePath.startsWith(path.normalize(basePath))) {
      return new Response("Access Denied", { status: 403 });
    }

    // convert app protocol url into file protocol url
    // /home/prajwal/.config/QuickCart-Dev/product-images/<file-name>.jpg -> file:///home/prajwal/.config/QuickCart-Dev/product-images/<file-name>.jpg
    const safeFileUrl = pathToFileURL(absolutePath).toString();
    return net.fetch(safeFileUrl);
  });
}
