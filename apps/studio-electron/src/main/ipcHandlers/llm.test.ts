import { describe, it, expect } from "vitest";
import { generateFromSchema } from "../providers/mockLlmProvider.js";

describe("LLM Provider", () => {
  describe("generateFromSchema", () => {
    it("generates string for string type", () => {
      const result = generateFromSchema({ type: "string" });
      expect(typeof result).toBe("string");
    });

    it("generates number for number type", () => {
      const result = generateFromSchema({ type: "number" });
      expect(typeof result).toBe("number");
    });

    it("generates boolean for boolean type", () => {
      const result = generateFromSchema({ type: "boolean" });
      expect(typeof result).toBe("boolean");
    });

    it("generates array for array type", () => {
      const result = generateFromSchema({ type: "array", items: { type: "string" } });
      expect(Array.isArray(result)).toBe(true);
    });

    it("generates object with properties", () => {
      const result = generateFromSchema({
        type: "object",
        properties: {
          name: { type: "string" },
          count: { type: "number" },
        },
      });
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("count");
    });

    it("uses const value when specified", () => {
      const result = generateFromSchema({ const: "fixed_value" });
      expect(result).toBe("fixed_value");
    });

    it("uses first enum value when specified", () => {
      const result = generateFromSchema({ enum: ["first", "second", "third"] });
      expect(result).toBe("first");
    });
  });
});
