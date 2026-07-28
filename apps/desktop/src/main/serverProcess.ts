import { fork, type ChildProcess } from "node:child_process";
import { join } from "node:path";

let serverProcess: ChildProcess | undefined;

// Starts the local API process and waits until it says it is ready.
export function startServerProcess(): Promise<void> {
  if (serverProcess) return Promise.resolve();

  const child = fork(join(__dirname, "server.js"), [], {
    env: process.env,
    stdio: ["inherit", "inherit", "inherit", "ipc"]
  });
  serverProcess = child;

  return new Promise((resolve, reject) => {
    child.once("message", (message) => {
      if (message === "server-ready") resolve();
    });
    child.once("error", (error) => {
      serverProcess = undefined;
      reject(error);
    });
    child.once("exit", (code) => {
      serverProcess = undefined;
      reject(new Error(`The local QuickCart server stopped with code ${code}.`));
    });
  });
}

// Stops the local API process when startup fails or Electron quits.
export function stopServerProcess(): void {
  serverProcess?.kill();
  serverProcess = undefined;
}
