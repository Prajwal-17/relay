import { describe, expect, it } from "vitest";
import { upiQrProfileSchema } from "./preferences.schema";

const PROFILE = {
  id: "11111111-1111-4111-8111-111111111111",
  upiId: "shop@bank",
  payeeName: "Relay Store"
};

describe("upiQrProfileSchema", () => {
  it("accepts names up to 60 characters", () => {
    expect(upiQrProfileSchema.safeParse({ ...PROFILE, label: "a".repeat(60) }).success).toBe(true);
  });

  it("rejects names above 60 characters", () => {
    const result = upiQrProfileSchema.safeParse({ ...PROFILE, label: "a".repeat(61) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Name must be 60 characters or less");
    }
  });
});
