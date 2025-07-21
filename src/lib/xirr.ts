/**
 * Offline XIRR (Newton-Raphson) for cash-flows
 * @param cashflows [{date, amount}, …] amount > 0 = inflow, < 0 = outflow
 * @param guess optional starting rate (default 0.1 = 10 %)
 * @returns annualised IRR or NaN if not converged
 */
export function xirr(
  cashflows: { date: Date; amount: number }[],
  guess = 0.1
): number {
  const EPS = 1e-6;
  const MAX_ITER = 100;
  let rate = guess;

  const days = (d: Date) => d.getTime() / (1000 * 60 * 60 * 24);
  const first = days(cashflows[0].date);

  const f = (r: number) =>
    cashflows.reduce(
      (sum, cf) => sum + cf.amount / Math.pow(1 + r, (days(cf.date) - first) / 365),
      0
    );

  const df = (r: number) =>
    cashflows.reduce(
      (sum, cf) =>
        sum -
        (cf.amount * (days(cf.date) - first)) /
        (365 * Math.pow(1 + r, (days(cf.date) - first) / 365 + 1)),
      0
    );

  for (let i = 0; i < MAX_ITER; i++) {
    const newRate = rate - f(rate) / df(rate);
    if (Math.abs(newRate - rate) < EPS) return newRate;
    rate = newRate;
  }
  return NaN;
}
