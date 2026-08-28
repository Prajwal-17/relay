import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const desktopRoot = path.resolve(import.meta.dirname, "..");
const playwrightCli = require.resolve("@playwright/test/cli");
const resultsRoot = path.join(desktopRoot, "test-results");
const lockPath = path.join(resultsRoot, "billing-e2e-runner.json");
const setprivPath = "/usr/bin/setpriv";
const xvfbRunPath = "/usr/bin/xvfb-run";
const xvfbScreen = "-screen 0 1440x900x24";

let activeChild: ChildProcess | null = null;
let shuttingDown = false;

function processIsRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function parentPidOf(pid: number): number | null {
  if (process.platform !== "linux") return null;
  try {
    const status = readFileSync(`/proc/${pid}/status`, "utf8");
    const match = /^PPid:\s+(\d+)$/m.exec(status);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function captureOwnerChain(): number[] {
  const owners: number[] = [];
  let pid: number | null = process.ppid;
  while (pid && pid > 1 && owners.length < 16) {
    owners.push(pid);
    if (process.platform !== "linux") break;
    pid = parentPidOf(pid);
  }
  return owners;
}

const ownerChain = captureOwnerChain();

function terminateActive(signal: NodeJS.Signals): void {
  const pid = activeChild?.pid;
  if (!pid || !processIsRunning(pid)) return;

  if (process.platform === "win32") {
    spawnSync(
      "taskkill",
      ["/pid", String(pid), "/t", signal === "SIGKILL" ? "/f" : ""].filter(Boolean),
      {
        stdio: "ignore"
      }
    );
    return;
  }

  try {
    process.kill(-pid, signal);
  } catch {
    // The child may have completed between the liveness check and the signal.
  }
}

function handleSignal(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  releaseLock();
  shuttingDown = true;
  terminateActive(signal);
  setTimeout(() => {
    terminateActive("SIGKILL");
    process.exit(signal === "SIGINT" ? 130 : 143);
  }, 2_000);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
  process.once(signal, () => handleSignal(signal));
}
process.once("exit", () => {
  terminateActive("SIGTERM");
  releaseLock();
});
const ownerMonitor = setInterval(() => {
  if (!shuttingDown && ownerChain.some((pid) => !processIsRunning(pid))) {
    handleSignal("SIGTERM");
  }
}, 1_000);
ownerMonitor.unref();

async function stopPreviousOwnedRunner(): Promise<void> {
  if (!existsSync(lockPath) || process.platform !== "linux") return;

  try {
    const { pid } = JSON.parse(readFileSync(lockPath, "utf8")) as { pid?: number };
    if (!pid || pid === process.pid || !processIsRunning(pid)) return;
    const commandLine = readFileSync(`/proc/${pid}/cmdline`, "utf8");
    if (!commandLine.includes("e2e/run-billing.ts")) return;

    process.kill(pid, "SIGTERM");
    const deadline = Date.now() + 3_000;
    while (processIsRunning(pid) && Date.now() < deadline) {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
    if (processIsRunning(pid)) process.kill(pid, "SIGKILL");
  } catch {
    // A stale or concurrently removed lock does not block a safe new run.
  }
}

function acquireLock(): void {
  mkdirSync(resultsRoot, { recursive: true });
  writeFileSync(
    lockPath,
    JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })
  );
}

function releaseLock(): void {
  try {
    const { pid } = JSON.parse(readFileSync(lockPath, "utf8")) as { pid?: number };
    if (pid === process.pid) rmSync(lockPath, { force: true });
  } catch {
    // Nothing remains to release.
  }
}

async function runOwned(command: string, args: string[]): Promise<number> {
  const useParentDeathSignal = process.platform === "linux" && existsSync(setprivPath);
  const executable = useParentDeathSignal ? setprivPath : command;
  const executableArgs = useParentDeathSignal
    ? ["--pdeathsig", "TERM", "--", command, ...args]
    : args;

  const child = spawn(executable, executableArgs, {
    cwd: desktopRoot,
    env: process.env,
    stdio: "inherit",
    detached: process.platform !== "win32"
  });
  activeChild = child;

  return new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (activeChild === child) activeChild = null;
      resolve(code ?? (signal === "SIGINT" ? 130 : 1));
    });
  });
}

async function main(): Promise<void> {
  await stopPreviousOwnedRunner();
  acquireLock();

  const forwardedArgs = process.argv.slice(2);
  if (forwardedArgs[0] === "--") forwardedArgs.shift();

  try {
    if (process.platform === "linux" && !existsSync(xvfbRunPath)) {
      throw new Error(
        "Billing Electron E2E requires /usr/bin/xvfb-run on Linux. Install Xvfb; the runner uses an isolated 1440x900x24 screen and will not fall back to the operator's display."
      );
    }
    const playwrightCommand = process.platform === "linux" ? xvfbRunPath : process.execPath;
    const playwrightArgs =
      playwrightCommand === xvfbRunPath
        ? [
            "-a",
            "-s",
            xvfbScreen,
            process.execPath,
            playwrightCli,
            "test",
            "--config=e2e/playwright.config.ts",
            ...forwardedArgs
          ]
        : [playwrightCli, "test", "--config=e2e/playwright.config.ts", ...forwardedArgs];
    const steps: Array<[string, string[]]> = [
      ["pnpm", ["run", "rebuild:electron"]],
      ["pnpm", ["run", "build:e2e"]],
      [playwrightCommand, playwrightArgs]
    ];

    for (const [command, args] of steps) {
      const exitCode = await runOwned(command, args);
      if (shuttingDown) return;
      if (exitCode !== 0) {
        process.exitCode = exitCode;
        return;
      }
    }
  } finally {
    releaseLock();
  }
}

void main().catch((error: unknown) => {
  releaseLock();
  console.error(error);
  process.exitCode = 1;
});
