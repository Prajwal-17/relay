import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generateProductSnapshot, type SnapshotPayload } from "../utils/productSnapshot";

function snap(overrides: Partial<SnapshotPayload> = {}): string {
  const payload: SnapshotPayload = {
    name: "Tea",
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
      expect(snap()).toBe("Tea");
    });

    it("returns just the name when weight, unit, and mrp are explicitly null", () => {
      expect(snap({ weight: null, unit: null, mrp: null })).toBe("Tea");
    });

    it("returns just the name regardless of the product name text", () => {
      expect(snap({ name: "Amul Gold Milk", weight: null, unit: null, mrp: null })).toBe(
        "Amul Gold Milk"
      );
    });
  });

  describe("weight + unit + mrp all present, label eligible", () => {
    it("appends weight+unit and integer mrp to the name", () => {
      expect(snap({ weight: "500", unit: "ml", mrp: 25 })).toBe("Tea 500ml 25Rs");
    });

    it("appends weight+unit and mrp with a different unit", () => {
      expect(snap({ weight: "250", unit: "g", mrp: 50 })).toBe("Tea 250g 50Rs");
    });

    it('appends weight+unit and mrp with a "Litre" unit', () => {
      expect(snap({ weight: "1", unit: "Litre", mrp: 72 })).toBe("Tea 1Litre 72Rs");
    });

    it("appends weight+unit and mrp for a fractional weight", () => {
      expect(snap({ weight: "2.5", unit: "kg", mrp: 200 })).toBe("Tea 2.5kg 200Rs");
    });

    it("appends weight+unit and a fractional-rupee mrp", () => {
      expect(snap({ weight: "500", unit: "g", mrp: 54.99 })).toBe("Tea 500g 54.99Rs");
    });

    it("appends weight+unit only when mrp is absent", () => {
      expect(snap({ weight: "500", unit: "ml", mrp: null })).toBe("Tea 500ml");
    });

    it("does not duplicate the weight or mrp in the output", () => {
      const result = snap({ weight: "2", unit: "kg", mrp: 80 });
      expect(result).toBe("Tea 2kg 80Rs");
      const rsCount = result.split(" ").filter((p) => p.endsWith("Rs")).length;
      expect(rsCount).toBe(1);
    });
  });

  describe("weight + unit in the ignored set", () => {
    it("appends only mrp for '1pc'", () => {
      expect(snap({ weight: "1", unit: "pc", mrp: 30 })).toBe("Tea 30Rs");
    });

    it("appends only mrp for '1ml'", () => {
      expect(snap({ weight: "1", unit: "ml", mrp: 50 })).toBe("Tea 50Rs");
    });

    it("appends only mrp for '1g'", () => {
      expect(snap({ weight: "1", unit: "g", mrp: 10 })).toBe("Tea 10Rs");
    });

    it("appends only mrp for '1kg'", () => {
      expect(snap({ weight: "1", unit: "kg", mrp: 150 })).toBe("Tea 150Rs");
    });

    it("appends only mrp for 'none'", () => {
      expect(snap({ weight: "none", unit: "", mrp: 55 })).toBe("Tea 55Rs");
    });

    it("appends only mrp for an empty weight+unit", () => {
      expect(snap({ weight: "", unit: "", mrp: 25 })).toBe("Tea 25Rs");
    });

    it("suppresses the weight entirely when no mrp is present", () => {
      expect(snap({ weight: "1", unit: "pc", mrp: null })).toBe("Tea");
      expect(snap({ weight: "none", unit: "", mrp: null })).toBe("Tea");
      expect(snap({ weight: "", unit: "", mrp: null })).toBe("Tea");
    });
  });

  describe("weight present but unit is null (label not formable)", () => {
    it("falls back to mrp only, never stringifying null", () => {
      const result = snap({ weight: "500", unit: null, mrp: 25 });
      expect(result).not.toContain("null");
      expect(result).toBe("Tea 25Rs");
    });

    it("falls back to name only when mrp is also absent, never stringifying null", () => {
      const result = snap({ weight: "500", unit: null, mrp: null });
      expect(result).not.toContain("null");
      expect(result).toBe("Tea");
    });
  });

  describe("weight = null, mrp present", () => {
    it("appends only mrp to the name", () => {
      expect(snap({ weight: null, mrp: 100 })).toBe("Tea 100Rs");
    });

    it("handles large mrp values", () => {
      expect(snap({ weight: null, mrp: 99_999 })).toBe("Tea 99999Rs");
    });
  });

  describe("mrp = 0 (treated as falsy / no mrp)", () => {
    it("appends weight+unit only when a weight is present", () => {
      expect(snap({ weight: "500", unit: "ml", mrp: 0 })).toBe("Tea 500ml");
    });

    it("returns just the name when no weight is present", () => {
      expect(snap({ mrp: 0 })).toBe("Tea");
    });
  });

  describe("edge cases", () => {
    it("does not show 'null' anywhere when unit is null and weight is present with mrp", () => {
      expect(snap({ weight: "500", unit: null, mrp: 25 })).toBe("Tea 25Rs");
    });

    it("handles an empty product name, leaving a leading space before the suffix", () => {
      // documents current behavior: " 500ml 30Rs" (leading space from empty name)
      expect(snap({ name: "", weight: "500", unit: "ml", mrp: 30 })).toBe(" 500ml 30Rs");
    });

    it("does not duplicate weight or mrp for an eligible weight", () => {
      const result = snap({ weight: "500", unit: "ml", mrp: 25 });
      expect(result).toBe("Tea 500ml 25Rs");
      const rsCount = result.split(" ").filter((p) => p.endsWith("Rs")).length;
      expect(rsCount).toBe(1);
    });
  });

  describe("invariants", () => {
    it("is pure: the same payload always yields the same snapshot", () => {
      const payload: SnapshotPayload = {
        name: "Tea",
        weight: "500",
        unit: "g",
        mrp: 25
      };
      expect(generateProductSnapshot(payload)).toBe(generateProductSnapshot(payload));
    });

    it("renders every eligible positive mrp exactly once, for any weight and mrp", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10_000 }).map(String),
          fc.integer({ min: 1, max: 1_000_000 }),
          (weight, mrp) => {
            expect(snap({ weight, unit: "g", mrp })).toBe(`Tea ${weight}g ${mrp}Rs`);
          }
        ),
        { seed: 20260719, numRuns: 500 }
      );
    });
  });
});
