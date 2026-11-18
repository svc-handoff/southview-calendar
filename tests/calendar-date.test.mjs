import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

function dateInZone(timeZone, instant) {
  const moduleUrl = new URL('../lib/calendar-date.ts', import.meta.url).href;
  const code = `import {localCalendarDate} from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(localCalendarDate(new Date(${JSON.stringify(instant)}))));`;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    env: { ...process.env, TZ: timeZone }, encoding: 'utf8',
  }));
}

test('visitors west of UTC still see November 17 after UTC midnight', () => {
  for (const zone of ['America/New_York', 'America/Los_Angeles']) {
    assert.deepEqual(dateInZone(zone, '2026-11-18T02:30:00Z'), {
      year: 2026, month: 10, day: 17, key: '2026-11-17',
    });
  }
});

test('visitors east of UTC see their own next day', () => {
  assert.deepEqual(dateInZone('Asia/Tokyo', '2026-11-17T20:00:00Z'), {
    year: 2026, month: 10, day: 18, key: '2026-11-18',
  });
});

test('the local date key distinguishes months and years at a year boundary', () => {
  assert.deepEqual(dateInZone('America/New_York', '2027-01-01T02:00:00Z'), {
    year: 2026, month: 11, day: 31, key: '2026-12-31',
  });
});

test('the visitor time zone follows daylight saving time rather than a fixed offset', () => {
  assert.equal(dateInZone('America/New_York', '2026-07-18T04:30:00Z').key, '2026-07-18');
});
