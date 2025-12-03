// Formatting utilities

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...options,
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

export function formatWeight(kg: number): string {
  return `${kg.toLocaleString("en-IN")} kg`
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN")
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
