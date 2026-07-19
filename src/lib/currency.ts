const CPI_1987 = 113.6;
const CPI_JUNE_2026 = 333.952;

export function valueIn2026(amountIn1987: number): number {
  return amountIn1987 * (CPI_JUNE_2026 / CPI_1987);
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
