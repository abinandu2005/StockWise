import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(date) {
  if (!date) return "Never";
  let d = date;
  if (Array.isArray(date)) {
    d = new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date) {
  if (!date) return "Never";
  let d = date;
  if (Array.isArray(date)) {
    d = new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str, length) {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}
