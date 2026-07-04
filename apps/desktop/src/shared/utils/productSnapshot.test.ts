import { describe, expect, it } from "vitest";
import { generateProductSnapshot, type SnapshotPayload } from "../utils/productSnapshot";

function snap(overrides: Partial<SnapshotPayload> = {}): string {
  const payload: SnapshotPayload = {
    name: "Amul Gold Milk",
    weight: null,
    unit: null,
    mrp: null,
    ...overrides
  };
  return generateProductSnapshot(payload);
}

describe("generateProductSnapshot", () => {
  describe("name only (no weight, no mrp)", () => {
    it("returns just the name when weight and mrp are null", () => {
      expect(snap()).toBe("Amul Gold Milk");
    });

    it("returns just the name when weight and mrp are explicitly null", () => {
      expect(snap({ weight: null, mrp: null })).toBe("Amul Gold Milk");
    });
  });

  describe("weight present, mrp present, weight+unit NOT in ignoredWeight", () => {
    it("appends weight+unit and mrp to the name", () => {
      expect(snap({ weight: "500", unit: "ml", mrp: 25 })).toBe("Amul Gold Milk 500ml 25Rs");
    });

    it("appends weight+unit and mrp with different units", () => {
      expect(snap({ weight: "250", unit: "g", mrp: 50 })).toBe("Amul Gold Milk 250g 50Rs");
    });

    it('appends weight+unit and mrp with "Litre" unit', () => {
      expect(snap({ weight: "1", unit: "Litre", mrp: 72 })).toBe("Amul Gold Milk 1Litre 72Rs");
    });

    it("appends weight+unit and mrp for weight that happens to be a number-like string", () => {
      expect(snap({ weight: "2.5", unit: "kg", mrp: 200 })).toBe("Amul Gold Milk 2.5kg 200Rs");
    });

    it("falls back to mrp-only when unit is null (weight+unit cannot form a valid label)", () => {
      expect(snap({ weight: "", unit: null, mrp: 40 })).toBe("Amul Gold Milk 40Rs");
    });
  });

  describe("weight present, mrp present, weight+unit IS in ignoredWeight", () => {
    it("appends only mrp when weight+unit is '1pc'", () => {
      expect(snap({ weight: "1", unit: "pc", mrp: 30 })).toBe("Amul Gold Milk 30Rs");
    });

    it("appends only mrp when weight+unit is '1ml'", () => {
      expect(snap({ weight: "1", unit: "ml", mrp: 50 })).toBe("Amul Gold Milk 50Rs");
    });

    it("appends only mrp when weight+unit is '1g'", () => {
      expect(snap({ weight: "1", unit: "g", mrp: 10 })).toBe("Amul Gold Milk 10Rs");
    });

    it("appends only mrp when weight+unit is '1kg'", () => {
      expect(snap({ weight: "1", unit: "kg", mrp: 150 })).toBe("Amul Gold Milk 150Rs");
    });

    it("appends only mrp when weight+unit is 'none' and mrp present", () => {
      expect(snap({ weight: "none", unit: "", mrp: 55 })).toBe("Amul Gold Milk 55Rs");
    });
  });

  describe("weight = null, mrp present", () => {
    it("appends only mrp to the name", () => {
      expect(snap({ weight: null, mrp: 100 })).toBe("Amul Gold Milk 100Rs");
    });
  });

  describe("weight present, mrp = null", () => {
    it("appends only weight+unit to the name", () => {
      expect(snap({ weight: "500", unit: "ml", mrp: null })).toBe("Amul Gold Milk 500ml");
    });

    it("suppresses weight+unit when combo is in ignoredWeight even without mrp — shows name only", () => {
      expect(snap({ weight: "1", unit: "pc", mrp: null })).toBe("Amul Gold Milk");
    });

    it("suppresses weight+unit when combo is 'none' and no mrp — shows name only", () => {
      expect(snap({ weight: "none", unit: "", mrp: null })).toBe("Amul Gold Milk");
    });

    it("suppresses weight+unit when combo is empty string and no mrp — shows name only", () => {
      expect(snap({ weight: "", unit: "", mrp: null })).toBe("Amul Gold Milk");
    });
  });

  describe("mrp = 0 (falsy value)", () => {
    it("treats mrp=0 as no mrp (falsy), appends weight+unit only", () => {
      expect(snap({ weight: "500", unit: "ml", mrp: 0 })).toBe("Amul Gold Milk 500ml");
    });

    it("treats mrp=0 as no mrp, returns just name when no weight either", () => {
      expect(snap({ mrp: 0 })).toBe("Amul Gold Milk");
    });
  });

  describe("edge cases", () => {
    it("does not show 'null' string when unit is null with weight present — falls back to mrp-only", () => {
      const result = snap({ weight: "500", unit: null, mrp: 25 });
      expect(result).not.toContain("null");
      expect(result).toBe("Amul Gold Milk 25Rs");
    });

    it("does not show 'null' string when unit is null with weight present and no mrp — shows name only", () => {
      const result = snap({ weight: "500", unit: null, mrp: null });
      expect(result).not.toContain("null");
      expect(result).toBe("Amul Gold Milk");
    });

    it("handles weight as empty string (treated as having weight, in ignoredWeight)", () => {
      expect(snap({ weight: "", unit: "", mrp: 25 })).toBe("Amul Gold Milk 25Rs");
    });

    it("handles all fields null except name", () => {
      expect(snap({ weight: null, unit: null, mrp: null, name: "Test" })).toBe("Test");
    });

    it("handles large mrp values", () => {
      expect(snap({ weight: null, mrp: 99999 })).toBe("Amul Gold Milk 99999Rs");
    });

    it("handles product with empty string name", () => {
      expect(snap({ name: "", weight: "500", unit: "ml", mrp: 30 })).toBe(" 500ml 30Rs");
    });

    it("does not duplicate weight+mrp for weight NOT in ignoredWeight", () => {
      const result = snap({ weight: "500", unit: "ml", mrp: 25 });
      expect(result).toBe("Amul Gold Milk 500ml 25Rs");
      const parts = result.split(" ");
      const rsCount = parts.filter((p) => p.endsWith("Rs")).length;
      expect(rsCount).toBe(1);
    });
  });
});
