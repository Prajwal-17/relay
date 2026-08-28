import { describe, expect, it } from "vitest";
import { validatePrinterName } from "../../../ipcHandlers/printHandlers/windowsRawPrinter";

describe("Windows RAW printer", () => {
  it("rejects missing or invalid Windows printer names", () => {
    expect(() => validatePrinterName("")).toThrow(
      "Select a Windows printer in Settings before printing."
    );
    expect(() => validatePrinterName(undefined)).toThrow(
      "Select a Windows printer in Settings before printing."
    );
    expect(() => validatePrinterName("Printer\nName")).toThrow(
      "The Windows printer name is invalid."
    );
    expect(() => validatePrinterName("x".repeat(201))).toThrow(
      "The Windows printer name is invalid."
    );
  });

  it("trims a valid Windows printer name", () => {
    expect(validatePrinterName("  Everycom EC-801  ")).toBe("Everycom EC-801");
  });
});
