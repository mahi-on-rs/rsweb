const TAX_MODEL = "invoice-level";
const REFUND_APPROVAL_MODEL = "auto-approved";
const INVOICE_PREFIX = process.env.INVOICE_PREFIX || "INV";
const CHALAN_PREFIX = process.env.CHALAN_PREFIX || "CHL";

function assertNonEmpty(value, field) {
  if (!String(value || "").trim()) {
    const err = new Error(`${field} is required`);
    err.status = 400;
    throw err;
  }
}

function assertPositiveInt(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(`${field} must be a positive integer`);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function assertNonNegative(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const err = new Error(`${field} must be a non-negative number`);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function monthStamp(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

module.exports = {
  TAX_MODEL,
  REFUND_APPROVAL_MODEL,
  INVOICE_PREFIX,
  CHALAN_PREFIX,
  assertNonEmpty,
  assertPositiveInt,
  assertNonNegative,
  monthStamp
};
