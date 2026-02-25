const test = require('node:test');
const assert = require('node:assert/strict');

const {
  monthStamp,
  TAX_MODEL,
  REFUND_APPROVAL_MODEL,
  assertNonEmpty,
  assertPositiveInt,
  assertNonNegative
} = require('../inventory-rules');

test('monthStamp formats YYYYMM', () => {
  const value = monthStamp(new Date('2026-03-12T00:00:00.000Z'));
  assert.equal(value, '202603');
});

test('business decisions are fixed in backend constants', () => {
  assert.equal(TAX_MODEL, 'invoice-level');
  assert.equal(REFUND_APPROVAL_MODEL, 'auto-approved');
});

test('assertNonEmpty rejects blank values', () => {
  assert.throws(() => assertNonEmpty('', 'Name'));
  assert.throws(() => assertNonEmpty('   ', 'Name'));
});

test('assertPositiveInt supports only positive integers', () => {
  assert.equal(assertPositiveInt(2, 'qty'), 2);
  assert.throws(() => assertPositiveInt(0, 'qty'));
  assert.throws(() => assertPositiveInt(1.5, 'qty'));
});

test('assertNonNegative supports zero and positives', () => {
  assert.equal(assertNonNegative(0, 'rate'), 0);
  assert.equal(assertNonNegative(10.5, 'rate'), 10.5);
  assert.throws(() => assertNonNegative(-1, 'rate'));
});
