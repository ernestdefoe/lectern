// node --test js/tests: the allow-list that decides which PDF links become anchors.
import test from 'node:test';
import assert from 'node:assert/strict';
import { safeUrl, destinationPage } from '../src/forum/viewer/links.js';

test('web and mail addresses pass', () => {
  assert.equal(safeUrl('https://example.com/a?b=1#c'), 'https://example.com/a?b=1#c');
  assert.equal(safeUrl('http://example.com'), 'http://example.com/');
  assert.equal(safeUrl('mailto:someone@example.com'), 'mailto:someone@example.com');
  assert.equal(safeUrl('  HTTPS://Example.com '), 'https://example.com/');
});

test('everything else is refused', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    '\u0001javascript:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://example.com/file',
    'tel:+15555550100',
    'blob:https://example.com/x',
    '/relative/path',
    'example.com',
    '',
    null,
    undefined,
    42,
  ]) {
    assert.equal(safeUrl(bad), null, String(bad));
  }
});

test('destinations resolve to 1-based pages', async () => {
  const ref = { num: 7, gen: 0 };
  const doc = {
    getDestination: async (name) => (name === 'intro' ? [ref, { name: 'XYZ' }, 0, 0, null] : null),
    getPageIndex: async (r) => (r === ref ? 2 : Promise.reject(new Error('bad ref'))),
  };
  assert.equal(await destinationPage(doc, 'intro'), 3);
  assert.equal(await destinationPage(doc, [ref, { name: 'Fit' }]), 3);
  assert.equal(await destinationPage(doc, [4, { name: 'Fit' }]), 5);
  assert.equal(await destinationPage(doc, 'missing'), null);
  assert.equal(await destinationPage(doc, [{ num: 99, gen: 0 }]), null);
});
