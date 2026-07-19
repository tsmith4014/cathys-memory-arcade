import { formatDollars, shareOfPay, valueIn2026 } from "./currency";

describe("token economics", () => {
  it("converts five 1987 dollars using documented CPI values", () => {
    expect(valueIn2026(5)).toBeCloseTo(14.70, 2);
    expect(formatDollars(valueIn2026(5))).toBe("$14.70");
  });

  it("calculates the share of a cleaning job", () => {
    expect(shareOfPay(5, 40)).toBe(12.5);
    expect(shareOfPay(5, 25)).toBe(20);
  });

  it("rejects invalid pay values", () => {
    expect(() => shareOfPay(5, 0)).toThrow(RangeError);
  });
});
