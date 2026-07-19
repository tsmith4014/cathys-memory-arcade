const CPI_1986 = 109.6;
const CPI_JUNE_2026 = 332.57;

export function valueIn2026(amountIn1986: number): number {
  return amountIn1986 * (CPI_JUNE_2026 / CPI_1986);
}

export function shareOfPay(cost: number, pay: number): number {
  if (pay <= 0) {
    throw new RangeError("pay must be greater than zero");
  }
  return (cost / pay) * 100;
}

export function formatDollars(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
