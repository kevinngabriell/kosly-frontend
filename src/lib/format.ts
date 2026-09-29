// Rupiah is always shown in Indonesian number format ("Rp 850.000"), even on the English UI.
const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIdr(amount: number): string {
  return IDR.format(amount);
}

const IDR_DIGITS = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Grouped digits without the currency symbol, for use inside an input next to a static "Rp" label. */
export function formatIdrDigits(amount: number): string {
  return IDR_DIGITS.format(amount);
}
