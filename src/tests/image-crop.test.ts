import { describe, expect, it } from "vitest";
import { computeSideCropRect } from "@/lib/image-crop";

describe("computeSideCropRect", () => {
  it("recorta 10% por cada lado", () => {
    const r = computeSideCropRect(1000, 600, 10);
    expect(r.left).toBe(100);
    expect(r.width).toBe(800);
    expect(r.height).toBe(600);
  });

  it("no recorta si quedaría demasiado angosto", () => {
    const r = computeSideCropRect(180, 200, 10);
    expect(r.width).toBe(180);
  });
});
