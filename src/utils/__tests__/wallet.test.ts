import { formatUsdc, truncateAddress } from "@/utils/format";

describe("formatUsdc", () => {
  it("formats zero", () => {
    expect(formatUsdc(0)).toBe("$0.00");
  });

  it("formats whole dollars", () => {
    expect(formatUsdc(100)).toBe("$100.00");
  });

  it("formats with decimals", () => {
    expect(formatUsdc(1234.56)).toBe("$1,234.56");
  });

  it("formats large numbers with commas", () => {
    expect(formatUsdc(1000000)).toBe("$1,000,000.00");
  });

  it("formats small values", () => {
    expect(formatUsdc(0.5)).toBe("$0.50");
  });
});

describe("truncateAddress", () => {
  it("truncates an Ethereum address", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
  });

  it("returns short strings as-is", () => {
    expect(truncateAddress("abc")).toBe("abc");
  });

  it("handles empty string", () => {
    expect(truncateAddress("")).toBe("");
  });
});
