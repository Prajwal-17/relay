import { BrowserWindow, ipcMain } from "electron";
import { google } from "googleapis";
import type { IncomingMessage, ServerResponse } from "http";
import http from "node:http";
import type { ApiResponse } from "../../shared/types";

export const startAuthServer = (authWindow: BrowserWindow): Promise<string> => {
  return new Promise((resolve, reject) => {
    const host = "localhost";
    const port = 3000;
    const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      if (!req.url) {
        res.statusCode = 400;
        res.end("Bad Request");
        return;
      }

      const url = new URL(req.url, `http://${host}:${port}`);

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const requestState = url.searchParams.get("state");

        if (!code || !requestState) {
          res.statusCode = 400;
          res.end("Missing 'code' or 'state' parameters");
          return;
        }
        try {
          const decodedState = JSON.parse(decodeURIComponent(requestState));
          const isPopup = decodedState.popup;
          if (isPopup) {
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify({ message: "Successfully Authenticated" }));
            authWindow.close();
            server.close();
            resolve(code);
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ message: "Url State not present" }));
            server.close();
          }
        } catch (error) {
          console.error("Error parsing state:", error);
          res.end("Authentication failed.");
          authWindow.close();
          server.close();
          reject(new Error("No authorization code received."));
        }
      } else {
        res.statusCode = 400;
        res.end("Not Found");
      }
    });

    server.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  });
};

type FilteredGoogleContactsType = {
  id: number;
  name: string | null;
  contact: string | null;
};

export default function importContactsFromGoogle() {
  ipcMain.handle(
    "customers:importContactsFromGoogle",
    async (): Promise<ApiResponse<FilteredGoogleContactsType[]>> => {
      try {
        const clientId = process.env.GOOGLE_CLIENT_ID as string;
        const clientSecret = process.env.GOOGLE_SECRET_ID as string;
        const redirectUri = "http://127.0.0.1:3000/callback";
        const state = encodeURIComponent(JSON.stringify({ popup: true }));

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const authUrl = oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: [
            "https://www.googleapis.com/auth/contacts",
            "https://www.googleapis.com/auth/contacts.readonly",
            "https://www.googleapis.com/auth/userinfo.profile"
          ],
          prompt: "consent",
          state
        });

        const authWindow = new BrowserWindow({
          width: 800,
          height: 800,
          autoHideMenuBar: true,
          webPreferences: { nodeIntegration: false }
        });

        authWindow.loadURL(authUrl);

        const code = await startAuthServer(authWindow);

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const peopleClient = google.people({
          version: "v1",
          auth: oauth2Client
        });

        const response = await peopleClient.people.connections.list({
          resourceName: "people/me",
          personFields: "names,phoneNumbers",
          sortOrder: "FIRST_NAME_ASCENDING",
          pageSize: 800
        });

        const filteredGoogleContacts: FilteredGoogleContactsType[] =
          response.data.connections?.map((obj, idx) => ({
            id: idx,
            name: obj.names?.[0]?.displayName ?? null,
            contact: obj.phoneNumbers?.[0]?.value?.replace(/\s/g, "") ?? null
          })) ?? [];

        return {
          status: "success",
          data: filteredGoogleContacts
        };
      } catch (error: any) {
        console.error("Error in importContactsFromGoogle:", error);
        return {
          status: "error",
          error: {
            message: "Failed to import contacts",
            details: error
          }
        };
      }
    }
  );
}
