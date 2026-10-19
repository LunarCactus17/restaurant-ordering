export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatPhoneForDisplay(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value;
}

export function formatEstimatedReadyTime(minutes: number) {
  const normalizedMinutes = Math.max(1, Math.round(minutes));

  if (normalizedMinutes < 60) {
    return `about ${normalizedMinutes} minute${normalizedMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(normalizedMinutes / 60);
  const remainderMinutes = normalizedMinutes % 60;

  if (remainderMinutes === 0) {
    return `about ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `about ${hours} hour${hours === 1 ? "" : "s"} ${remainderMinutes} minute${remainderMinutes === 1 ? "" : "s"}`;
}
