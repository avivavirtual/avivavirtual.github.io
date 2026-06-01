import assert from 'node:assert/strict';
import test from 'node:test';

function isAllowedWidgetHostname(allowedDomains, originOrReferer) {
  if (allowedDomains.length === 0) return true;
  if (!originOrReferer) return false;
  let hostname;
  try {
    hostname = new URL(originOrReferer).hostname;
  } catch {
    return false;
  }
  return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function safeWidgetColor(color) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#0EA5E9';
}

function formatTicketNumber(slug, date, sequence) {
  return `TKT-${slug}-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${String(sequence).padStart(4, '0')}`;
}

function calculateSlaDueAt(priority, sla, now) {
  const hours = priority === 'URGENT' ? sla.urgentHours : priority === 'HIGH' ? sla.highHours : priority === 'LOW' ? sla.lowHours : sla.mediumHours;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

test('widget domain rule allows exact and subdomain matches only', () => {
  assert.equal(isAllowedWidgetHostname(['rogers-demo.ca'], 'https://rogers-demo.ca/support'), true);
  assert.equal(isAllowedWidgetHostname(['rogers-demo.ca'], 'https://chat.rogers-demo.ca'), true);
  assert.equal(isAllowedWidgetHostname(['rogers-demo.ca'], 'https://evilrogers-demo.ca'), false);
  assert.equal(isAllowedWidgetHostname(['rogers-demo.ca'], 'not-a-url'), false);
});

test('widget color rule accepts six-digit hex and falls back for unsafe CSS', () => {
  assert.equal(safeWidgetColor('#E1251B'), '#E1251B');
  assert.equal(safeWidgetColor('#abc123'), '#abc123');
  assert.equal(safeWidgetColor('red;position:fixed'), '#0EA5E9');
});

test('ticket numbers are stable and tenant-prefixed', () => {
  assert.equal(formatTicketNumber('rogers', new Date('2026-05-31T12:00:00Z'), 7), 'TKT-rogers-20260531-0007');
});

test('SLA due date uses priority-specific hour mapping', () => {
  const now = new Date('2026-05-31T00:00:00Z');
  const sla = { urgentHours: 1, highHours: 4, mediumHours: 24, lowHours: 72 };
  assert.equal(calculateSlaDueAt('URGENT', sla, now).toISOString(), '2026-05-31T01:00:00.000Z');
  assert.equal(calculateSlaDueAt('HIGH', sla, now).toISOString(), '2026-05-31T04:00:00.000Z');
  assert.equal(calculateSlaDueAt('MEDIUM', sla, now).toISOString(), '2026-06-01T00:00:00.000Z');
  assert.equal(calculateSlaDueAt('LOW', sla, now).toISOString(), '2026-06-03T00:00:00.000Z');
});
