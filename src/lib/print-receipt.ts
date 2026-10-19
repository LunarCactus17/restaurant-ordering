import type { StaffOrder } from "@/lib/types";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function line(width = 42) {
  return "-".repeat(width);
}

export function formatOrderReceipt(order: StaffOrder) {
  const lines: string[] = [];

  lines.push("ONLINE PICKUP ORDER");
  lines.push(line());
  lines.push(`Order #: ${order.orderNumber}`);
  lines.push(`Submitted: ${formatDateTime(order.createdAt)}`);
  lines.push(
    `Pickup: ${order.requestedPickupAt ? formatDateTime(order.requestedPickupAt) : "ASAP"}`,
  );
  lines.push(`Customer: ${order.customerName?.trim() || "Pickup guest"}`);
  lines.push(`Phone: ${order.phone}`);

  if (order.notes?.trim()) {
    lines.push(line());
    lines.push("ORDER NOTE:");
    lines.push(order.notes.trim());
  }

  lines.push(line());
  lines.push("ITEMS:");

  for (const item of order.orderItems) {
    lines.push(`${item.itemNameSnapshot} x${item.quantity}`);

    if (item.modifiers.length > 0) {
      for (const modifier of item.modifiers) {
        lines.push(`  + ${modifier.optionNameSnapshot}`);
      }
    }

    if (item.specialInstructions?.trim()) {
      lines.push(`  Note: ${item.specialInstructions.trim()}`);
    }

    lines.push(`  ${formatMoney(item.lineTotalCents)}`);
  }

  lines.push(line());
  lines.push(`TOTAL DUE: ${formatMoney(order.totalCents)}`);
  lines.push(`Verify with order #${order.orderNumber} + phone`);
  lines.push(line());

  return `${lines.join("\n")}\n`;
}
