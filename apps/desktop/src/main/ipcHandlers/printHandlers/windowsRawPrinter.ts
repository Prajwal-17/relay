import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RAW_PRINTER_SOURCE = String.raw`
using System;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;

public static class RelayRawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private class DocInfo
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName = "Relay Raw Receipt";
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile = null;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType = "RAW";
    }

    [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool OpenPrinter(string printerName, out IntPtr printer, IntPtr defaults);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr printer);

    [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern int StartDocPrinter(IntPtr printer, int level, [In] DocInfo docInfo);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr printer);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool StartPagePrinter(IntPtr printer);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool EndPagePrinter(IntPtr printer);

    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr printer, IntPtr data, int count, out int written);

    public static int Send(string printerName, string filePath)
    {
        byte[] data = File.ReadAllBytes(filePath);
        IntPtr printer = IntPtr.Zero;
        IntPtr unmanagedData = IntPtr.Zero;
        bool documentStarted = false;
        bool pageStarted = false;

        try
        {
            if (!OpenPrinter(printerName, out printer, IntPtr.Zero))
                throw new Win32Exception(Marshal.GetLastWin32Error());
            if (StartDocPrinter(printer, 1, new DocInfo()) == 0)
                throw new Win32Exception(Marshal.GetLastWin32Error());
            documentStarted = true;
            if (!StartPagePrinter(printer))
                throw new Win32Exception(Marshal.GetLastWin32Error());
            pageStarted = true;

            unmanagedData = Marshal.AllocCoTaskMem(data.Length);
            Marshal.Copy(data, 0, unmanagedData, data.Length);
            int written;
            if (!WritePrinter(printer, unmanagedData, data.Length, out written))
                throw new Win32Exception(Marshal.GetLastWin32Error());
            if (written != data.Length)
                throw new IOException("Windows accepted only " + written + " of " + data.Length + " bytes.");

            return written;
        }
        finally
        {
            if (unmanagedData != IntPtr.Zero) Marshal.FreeCoTaskMem(unmanagedData);
            if (pageStarted) EndPagePrinter(printer);
            if (documentStarted) EndDocPrinter(printer);
            if (printer != IntPtr.Zero) ClosePrinter(printer);
        }
    }
}
`;

function quotePowerShell(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function encodedCommand(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

function runPowerShell(script: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encodedCommand(script)
      ],
      { windowsHide: true }
    );
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `PowerShell exited with code ${code}`));
        return;
      }

      const written = Number(stdout.trim().split(/\s+/).at(-1));
      if (!Number.isFinite(written)) {
        reject(new Error("Windows did not report how many bytes were printed."));
        return;
      }
      resolve(written);
    });
  });
}

export function validatePrinterName(printerName: unknown): string {
  if (typeof printerName !== "string") {
    throw new Error("Select a Windows printer in Settings before printing.");
  }

  const normalizedPrinterName = printerName.trim();
  if (!normalizedPrinterName) {
    throw new Error("Select a Windows printer in Settings before printing.");
  }
  if (
    normalizedPrinterName.length > 200 ||
    [...normalizedPrinterName].some((character) => character.charCodeAt(0) < 32)
  ) {
    throw new Error("The Windows printer name is invalid.");
  }
  return normalizedPrinterName;
}

export async function sendRawToWindowsPrinter(
  printerName: string,
  payload: Buffer
): Promise<number> {
  const normalizedPrinterName = validatePrinterName(printerName);
  if (process.platform !== "win32") {
    throw new Error("Raw thermal printing is available on Windows only.");
  }
  if (!Buffer.isBuffer(payload) || payload.length === 0) {
    throw new Error("The RAW printer payload is empty.");
  }

  const tempPath = join(tmpdir(), `relay-raw-print-${randomUUID()}.bin`);
  try {
    await fs.writeFile(tempPath, payload);

    const script = `
Add-Type -TypeDefinition @'
${RAW_PRINTER_SOURCE}
'@
$written = [RelayRawPrinter]::Send(${quotePowerShell(normalizedPrinterName)}, ${quotePowerShell(tempPath)})
Write-Output $written
`;

    const written = await runPowerShell(script);
    if (written !== payload.length) {
      throw new Error(`Windows accepted only ${written} of ${payload.length} bytes.`);
    }
    return written;
  } finally {
    await fs.rm(tempPath, { force: true });
  }
}
