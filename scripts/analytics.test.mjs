import assert from 'node:assert/strict';
import test from 'node:test';
import { interactionEvent } from '../src/utils/analytics.ts';

const registeredEvents = [
  'nav-skip', 'nav-reports', 'nav-about', 'nav-top', 'data-pipeline', 'source-code', 'logo-credit', 'support-coffee',
  'pay-base', 'pay-total', 'filter-country', 'filter-year', 'filter-role', 'filter-stage', 'filter-work', 'filter-search',
  'remove-country', 'remove-year', 'remove-role', 'remove-stage', 'remove-work', 'remove-search', 'reset-view', 'more-filters',
  'breakdown-country', 'breakdown-role', 'breakdown-year', 'groups-show-all', 'groups-show-fewer', 'chart-distribution',
  'chart-country', 'chart-role', 'chart-year', 'distribution-data', 'comparison-data', 'salary-position', 'salary-input',
  'export-csv', 'sort-title', 'sort-year', 'sort-base', 'sort-total', 'source-report', 'source-reddit', 'page-previous',
  'page-next', 'method-source', 'method-pay', 'method-labels', 'method-limits',
];

test('every declared interaction key produces a value-free fixed event contract', () => {
  for (const name of registeredEvents) {
    for (const action of ['click', 'change', 'open', 'close']) {
      const event = interactionEvent(name, action);
      assert.deepEqual(Object.keys(event).sort(), ['event', 'no_session', 'path', 'title']);
      assert.equal(event.path, `ui/${name}/${action}`);
      assert.equal(event.event, true);
      assert.equal(event.no_session, true);
      assert.match(event.title, new RegExp(`\\(${action}\\)$`));
      assert.doesNotMatch(JSON.stringify(event), /123456|record-368|source-body|private-entered-search/i);
    }
  }
});

test('unknown interaction keys are rejected instead of becoming arbitrary analytics paths', () => {
  for (const name of ['', 'salary=123456', 'record-368', 'source-body', 'not-registered']) {
    assert.equal(interactionEvent(name, 'click'), null);
  }
});
