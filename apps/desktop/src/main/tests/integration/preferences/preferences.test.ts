import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppConfig } from "../../../../shared/types";
import { appPreferences } from "../../../db/schema";
import { onboardingController } from "../../../modules/onboarding/onboarding.controller";
import { preferencesController } from "../../../modules/preferences/preferences.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  onboardingPayload,
  readJson,
  requestJson,
  type DB
} from "../../helpers";

type PreferencesBody = {
  id: string;
  storeId: string;
  config: AppConfig;
};

const PRIMARY_UPI_PROFILE = {
  id: "11111111-1111-4111-8111-111111111111",
  label: "Primary UPI",
  upiId: "shop@bank",
  payeeName: "QuickCart Market"
};

const SECONDARY_UPI_PROFILE = {
  id: "22222222-2222-4222-8222-222222222222",
  label: "Owner UPI",
  upiId: "owner@bank",
  payeeName: "Store Owner"
};

describe("preferences integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([
      { path: "/api/onboarding", controller: onboardingController },
      { path: "/api/app-preferences", controller: preferencesController }
    ]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  async function onboard() {
    const response = await requestJson(app, "POST", "/api/onboarding", onboardingPayload());
    expect(response.status).toBe(201);
    return readJson<{ customerId: string }>(response);
  }

  it("returns production defaults without requiring onboarding", async () => {
    const response = await getJson(app, "/api/app-preferences/defaults");
    const defaults = await readJson<AppConfig>(response);

    expect(response.status).toBe(200);
    expect(defaults.billing).toEqual({ defaultCustomerId: "", searchDropdown: { scale: 1 } });
    expect(defaults.exports).toMatchObject({
      askBeforeSavingPdf: true,
      defaultExportFormat: "pdf"
    });
    expect(defaults.exports.defaultPdfLocation).toContain("Downloads");
    expect(defaults.printing).toEqual({
      printerName: "",
      defaultPrintMode: "raster",
      extraFeedLines: 4,
      cutMode: "partial",
      showAddress: true,
      showPhone: true,
      showGstinOnSales: true,
      showCustomerName: true,
      showSavings: true,
      savingsThresholdPaisa: 0,
      showLedgerPaymentMode: true,
      showLedgerNotes: true,
      footerMessage: "Thank you. Visit again.",
      upiQrProfiles: [],
      defaultUpiQrProfileId: null,
      printUpiQrOnSales: false,
      printUpiQrOnEstimates: false,
      includeAmountInUpiQr: true
    });
  });

  it("returns 404 for missing persisted preferences", async () => {
    const getResponse = await getJson(app, "/api/app-preferences");
    expect(getResponse.status).toBe(404);

    const patchResponse = await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: { searchDropdown: { scale: 1.1 } }
    });
    expect(patchResponse.status).toBe(404);
    expect(db.select().from(appPreferences).all()).toEqual([]);
  });

  it("normalizes legacy printing preferences on read and update", async () => {
    await onboard();
    const current = db.select().from(appPreferences).get();
    expect(current).toBeDefined();

    const legacyConfig = {
      billing: current!.config.billing,
      exports: current!.config.exports,
      printing: {
        printerName: "Legacy printer",
        upiId: "legacy@bank",
        upiPayeeName: "Legacy Store",
        printUpiQrOnSales: true
      }
    } as unknown as AppConfig;
    db.update(appPreferences).set({ config: legacyConfig }).run();

    const readResponse = await getJson(app, "/api/app-preferences");
    const normalized = await readJson<PreferencesBody>(readResponse);
    expect(normalized.config.printing).toMatchObject({
      printerName: "Legacy printer",
      defaultPrintMode: "raster",
      extraFeedLines: 4,
      cutMode: "partial",
      showAddress: true,
      showCustomerName: true,
      showSavings: true,
      savingsThresholdPaisa: 0,
      showLedgerPaymentMode: true,
      showLedgerNotes: true,
      printUpiQrOnSales: true
    });
    expect(normalized.config.printing.upiQrProfiles).toEqual([
      {
        id: "00000000-0000-4000-8000-000000000001",
        label: "Primary UPI",
        upiId: "legacy@bank",
        payeeName: "Legacy Store"
      }
    ]);
    expect(normalized.config.printing.defaultUpiQrProfileId).toBe(
      "00000000-0000-4000-8000-000000000001"
    );

    const updateResponse = await requestJson(app, "PATCH", "/api/app-preferences", {
      printing: { footerMessage: "See you soon" }
    });
    const updated = await readJson<PreferencesBody>(updateResponse);
    expect(updated.config.printing).toEqual({
      ...normalized.config.printing,
      footerMessage: "See you soon"
    });
    expect(db.select().from(appPreferences).get()?.config).toEqual(updated.config);
  });

  it("loads onboarding preferences and deeply merges partial updates", async () => {
    const { customerId } = await onboard();
    const defaultsResponse = await getJson(app, "/api/app-preferences/defaults");
    const defaults = await readJson<AppConfig>(defaultsResponse);

    const beforeResponse = await getJson(app, "/api/app-preferences");
    const before = await readJson<PreferencesBody>(beforeResponse);
    expect(before.config.billing.defaultCustomerId).toBe(customerId);

    const response = await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: { searchDropdown: { scale: 1.25 } },
      exports: { askBeforeSavingPdf: false }
    });
    const updated = await readJson<PreferencesBody>(response);

    expect(response.status).toBe(200);
    expect(updated.config.billing).toEqual({
      defaultCustomerId: customerId,
      searchDropdown: { scale: 1.25 }
    });
    expect(updated.config.exports).toEqual({
      ...defaults.exports,
      askBeforeSavingPdf: false
    });
    expect(
      db.select().from(appPreferences).where(eq(appPreferences.storeId, "default")).get()?.config
    ).toEqual(updated.config);
  });

  it("resets exports and printing independently and rejects unknown sections", async () => {
    const { customerId } = await onboard();
    await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: { searchDropdown: { scale: 1.2 } },
      exports: {
        askBeforeSavingPdf: false,
        defaultPdfLocation: "/tmp/custom",
        defaultExportFormat: "png"
      },
      printing: {
        printerName: "Everycom",
        defaultPrintMode: "device-text",
        footerMessage: "Custom footer",
        upiQrProfiles: [PRIMARY_UPI_PROFILE],
        defaultUpiQrProfileId: PRIMARY_UPI_PROFILE.id,
        printUpiQrOnSales: true
      }
    });
    const defaultsResponse = await getJson(app, "/api/app-preferences/defaults");
    const defaults = await readJson<AppConfig>(defaultsResponse);

    const exportsResponse = await requestJson(app, "POST", "/api/app-preferences/reset/exports");
    const exportsReset = await readJson<PreferencesBody>(exportsResponse);
    expect(exportsReset.config.exports).toEqual(defaults.exports);
    expect(exportsReset.config.printing.footerMessage).toBe("Custom footer");
    expect(exportsReset.config.printing.defaultPrintMode).toBe("device-text");
    expect(exportsReset.config.printing.upiQrProfiles).toEqual([PRIMARY_UPI_PROFILE]);
    expect(exportsReset.config.billing).toEqual({
      defaultCustomerId: customerId,
      searchDropdown: { scale: 1.2 }
    });

    const printingResponse = await requestJson(app, "POST", "/api/app-preferences/reset/printing");
    const printingReset = await readJson<PreferencesBody>(printingResponse);
    expect(printingReset.config.printing).toEqual(defaults.printing);
    expect(printingReset.config.exports).toEqual(defaults.exports);

    const invalid = await requestJson(app, "POST", "/api/app-preferences/reset/billing");
    expect(invalid.status).toBe(400);
  });

  it("returns 404 when resetting exports before onboarding", async () => {
    const response = await requestJson(app, "POST", "/api/app-preferences/reset/exports");
    expect(response.status).toBe(404);
    expect(db.select().from(appPreferences).all()).toEqual([]);
  });

  it("updates every supported preference field and persists the result", async () => {
    await onboard();
    const response = await requestJson(app, "PATCH", "/api/app-preferences", {
      billing: {
        defaultCustomerId: "alternate-customer",
        searchDropdown: { scale: 0.8 }
      },
      exports: {
        askBeforeSavingPdf: false,
        defaultPdfLocation: "/exports",
        defaultExportFormat: "png"
      },
      printing: {
        printerName: "Everycom EC-801",
        defaultPrintMode: "device-text",
        extraFeedLines: 7,
        cutMode: "full",
        showAddress: false,
        showPhone: false,
        showGstinOnSales: false,
        showCustomerName: false,
        showSavings: false,
        savingsThresholdPaisa: 2000,
        showLedgerPaymentMode: false,
        showLedgerNotes: false,
        footerMessage: "Paid",
        upiQrProfiles: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            label: "Primary UPI",
            upiId: "shop@bank",
            payeeName: "QuickCart Market"
          }
        ],
        defaultUpiQrProfileId: "11111111-1111-4111-8111-111111111111",
        printUpiQrOnSales: true,
        printUpiQrOnEstimates: true,
        includeAmountInUpiQr: false
      }
    });
    const body = await readJson<PreferencesBody>(response);

    expect(response.status).toBe(200);
    expect(body.config).toEqual({
      billing: {
        defaultCustomerId: "alternate-customer",
        searchDropdown: { scale: 0.8 }
      },
      exports: {
        askBeforeSavingPdf: false,
        defaultPdfLocation: "/exports",
        defaultExportFormat: "png"
      },
      printing: {
        printerName: "Everycom EC-801",
        defaultPrintMode: "device-text",
        extraFeedLines: 7,
        cutMode: "full",
        showAddress: false,
        showPhone: false,
        showGstinOnSales: false,
        showCustomerName: false,
        showSavings: false,
        savingsThresholdPaisa: 2000,
        showLedgerPaymentMode: false,
        showLedgerNotes: false,
        footerMessage: "Paid",
        upiQrProfiles: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            label: "Primary UPI",
            upiId: "shop@bank",
            payeeName: "QuickCart Market"
          }
        ],
        defaultUpiQrProfileId: "11111111-1111-4111-8111-111111111111",
        printUpiQrOnSales: true,
        printUpiQrOnEstimates: true,
        includeAmountInUpiQr: false
      }
    });
    expect(db.select().from(appPreferences).get()?.config).toEqual(body.config);
  });

  it("persists both supported default print modes", async () => {
    await onboard();
    for (const defaultPrintMode of ["device-text", "raster"] as const) {
      const response = await requestJson(app, "PATCH", "/api/app-preferences", {
        printing: { defaultPrintMode }
      });
      expect(response.status).toBe(200);
      expect((await readJson<PreferencesBody>(response)).config.printing.defaultPrintMode).toBe(
        defaultPrintMode
      );
    }
  });

  it("defaults the first profile, promotes after deletion, and turns QR off after the last deletion", async () => {
    await onboard();

    const addedResponse = await requestJson(app, "PATCH", "/api/app-preferences", {
      printing: {
        upiQrProfiles: [PRIMARY_UPI_PROFILE, SECONDARY_UPI_PROFILE],
        printUpiQrOnSales: true,
        printUpiQrOnEstimates: true
      }
    });
    const added = await readJson<PreferencesBody>(addedResponse);
    expect(addedResponse.status).toBe(200);
    expect(added.config.printing.defaultUpiQrProfileId).toBe(PRIMARY_UPI_PROFILE.id);

    const promotedResponse = await requestJson(app, "PATCH", "/api/app-preferences", {
      printing: { upiQrProfiles: [SECONDARY_UPI_PROFILE] }
    });
    const promoted = await readJson<PreferencesBody>(promotedResponse);
    expect(promotedResponse.status).toBe(200);
    expect(promoted.config.printing.defaultUpiQrProfileId).toBe(SECONDARY_UPI_PROFILE.id);

    const removedResponse = await requestJson(app, "PATCH", "/api/app-preferences", {
      printing: { upiQrProfiles: [] }
    });
    const removed = await readJson<PreferencesBody>(removedResponse);
    expect(removedResponse.status).toBe(200);
    expect(removed.config.printing).toMatchObject({
      upiQrProfiles: [],
      defaultUpiQrProfileId: null,
      printUpiQrOnSales: false,
      printUpiQrOnEstimates: false
    });
  });

  it.each([
    ["scale below minimum", { billing: { searchDropdown: { scale: 0.79 } } }],
    ["scale above maximum", { billing: { searchDropdown: { scale: 1.51 } } }],
    ["empty customer ID", { billing: { defaultCustomerId: "" } }],
    ["non-boolean export flag", { exports: { askBeforeSavingPdf: "yes" } }],
    ["non-object billing", { billing: true }],
    ["non-object exports", { exports: [] }],
    ["non-boolean printing flag", { printing: { showAddress: "yes" } }],
    ["non-boolean customer flag", { printing: { showCustomerName: "yes" } }],
    ["non-boolean savings flag", { printing: { showSavings: "yes" } }],
    ["negative savings threshold", { printing: { savingsThresholdPaisa: -1 } }],
    ["fractional savings threshold", { printing: { savingsThresholdPaisa: 10.5 } }],
    ["non-boolean ledger flag", { printing: { showLedgerNotes: "yes" } }],
    ["negative printing feed lines", { printing: { extraFeedLines: -1 } }],
    ["excessive printing feed lines", { printing: { extraFeedLines: 11 } }],
    ["fractional printing feed lines", { printing: { extraFeedLines: 1.5 } }],
    ["unknown printing cut mode", { printing: { cutMode: "tear" } }],
    ["unknown default print mode", { printing: { defaultPrintMode: "png" } }],
    [
      "invalid UPI profile ID",
      {
        printing: {
          upiQrProfiles: [{ ...PRIMARY_UPI_PROFILE, id: "not-a-uuid" }],
          defaultUpiQrProfileId: PRIMARY_UPI_PROFILE.id
        }
      }
    ],
    [
      "invalid UPI ID",
      {
        printing: {
          upiQrProfiles: [{ ...PRIMARY_UPI_PROFILE, upiId: "not-a-vpa" }],
          defaultUpiQrProfileId: PRIMARY_UPI_PROFILE.id
        }
      }
    ],
    [
      "duplicate UPI profile IDs",
      {
        printing: {
          upiQrProfiles: [
            PRIMARY_UPI_PROFILE,
            { ...SECONDARY_UPI_PROFILE, id: PRIMARY_UPI_PROFILE.id }
          ],
          defaultUpiQrProfileId: PRIMARY_UPI_PROFILE.id
        }
      }
    ],
    [
      "duplicate UPI profile labels",
      {
        printing: {
          upiQrProfiles: [PRIMARY_UPI_PROFILE, { ...SECONDARY_UPI_PROFILE, label: "primary upi" }],
          defaultUpiQrProfileId: PRIMARY_UPI_PROFILE.id
        }
      }
    ],
    [
      "duplicate UPI IDs",
      {
        printing: {
          upiQrProfiles: [PRIMARY_UPI_PROFILE, { ...SECONDARY_UPI_PROFILE, upiId: "SHOP@BANK" }],
          defaultUpiQrProfileId: PRIMARY_UPI_PROFILE.id
        }
      }
    ],
    [
      "null default with UPI profiles",
      {
        printing: {
          upiQrProfiles: [PRIMARY_UPI_PROFILE],
          defaultUpiQrProfileId: null
        }
      }
    ],
    [
      "missing default UPI profile",
      {
        printing: {
          upiQrProfiles: [PRIMARY_UPI_PROFILE],
          defaultUpiQrProfileId: SECONDARY_UPI_PROFILE.id
        }
      }
    ],
    ["non-object printing", { printing: [] }]
  ])("rejects %s without changing preferences", async (_label, payload) => {
    await onboard();
    const before = db.select().from(appPreferences).get();

    const response = await requestJson(app, "PATCH", "/api/app-preferences", payload);

    expect(response.status).toBe(400);
    expect(db.select().from(appPreferences).get()).toEqual(before);
  });

  it("accepts boundary scale values", async () => {
    await onboard();
    for (const scale of [0.8, 1.5]) {
      const response = await requestJson(app, "PATCH", "/api/app-preferences", {
        billing: { searchDropdown: { scale } }
      });
      expect(response.status).toBe(200);
      expect((await readJson<PreferencesBody>(response)).config.billing.searchDropdown.scale).toBe(
        scale
      );
    }
  });
});
