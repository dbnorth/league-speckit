export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  const trimmed = value?.trim();
  return !!trimmed && EMAIL_REGEX.test(trimmed);
}

export const emailRules = [
  (value) => !!value?.trim() || "Email is required.",
  (value) => isValidEmail(value) || "Enter a valid email address.",
];

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

export function formatDate(value) {
  const dateOnly = toDateInputValue(value);

  if (!DATE_ONLY_REGEX.test(dateOnly)) {
    return "";
  }

  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
