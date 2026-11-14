import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function setup() {
  const element = () => ({ value: '', innerHTML: '', hidden: false, dataset: {}, events: {}, classList: { toggle() {} }, setAttribute() {}, addEventListener(name, fn) { this.events[name] = fn; }, focus() { this.focused = true; } });
  const ids = Object.fromEntries(['articles', 'story-dialog', 'search', 'empty', 'story-content', 'close-dialog', 'year'].map(id => [id, element()]));
  const filters = ['All', 'Food', 'Longevity', 'Nutrition', 'Wellness'].map(category => Object.assign(element(), { dataset: { category } }));
  ids['story-dialog'].showModal = () => { ids['story-dialog'].open = true; };
  ids['story-dialog'].close = () => { ids['story-dialog'].open = false; ids['story-dialog'].events.close(); };
  vm.runInNewContext(readFileSync(new URL('../app.js', import.meta.url), 'utf8'), { document: { querySelector: s => ids[s.slice(1)], querySelectorAll: () => filters }, Date });
  return { ids, filters, count: () => (ids.articles.innerHTML.match(/class="card"/g) || []).length };
}

test('readers can filter, search, and return to all stories', () => {
  const { ids, filters, count } = setup();
  assert.equal(count(), 6);
  filters[1].events.click();
  assert.equal(count(), 2);
  ids.search.value = 'no matching article';
  ids.search.events.input();
  assert.equal(count(), 0);
  assert.equal(ids.empty.hidden, false);
  ids.search.value = 'PANTRY';
  filters[0].events.click();
  assert.equal(count(), 1);
  ids.search.value = '';
  ids.search.events.input();
  assert.equal(count(), 6);
  assert.equal(ids.empty.hidden, true);
});

test('readers can open a story, close it, and retain keyboard focus', () => {
  const { ids } = setup();
  const trigger = { dataset: { story: 'colorful-bowl' }, focus() { this.focused = true; } };
  ids.articles.events.click({ target: { closest: () => trigger } });
  assert.equal(ids['story-dialog'].open, true);
  assert.match(ids['story-content'].innerHTML, /Build your bowl/);
  ids['close-dialog'].events.click();
  assert.equal(ids['story-dialog'].open, false);
  assert.equal(trigger.focused, true);
});
