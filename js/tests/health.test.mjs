import test from 'node:test';
import assert from 'node:assert/strict';
import { hasInk, looksBroken } from '../src/forum/viewer/health.js';

// A fake ImageData: white paper, with dark rectangles drawn where asked (in pixels).
function page(width, height, marks = [], { transparent = false } = {}) {
  const data = new Uint8ClampedArray(width * height * 4).fill(transparent ? 0 : 255);
  for (const [x0, y0, x1, y1, shade = 40] of marks) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * width + x) * 4;
        data.set([shade, shade, shade, 255], i);
      }
    }
  }
  return { data, width, height };
}

// Text boxes as fractions of a 100×100 page.
const line = (y) => ({ x0: 0.1, y0: y / 100, x1: 0.9, y1: (y + 2) / 100 });
const lines = Array.from({ length: 12 }, (_, k) => line(10 + k * 6));

test('white paper and a transparent canvas have no ink', () => {
  assert.equal(hasInk(page(100, 100)), false);
  assert.equal(hasInk(page(100, 100, [], { transparent: true })), false);
});

test('a single dark pixel is ink; near-white is not', () => {
  assert.equal(hasInk(page(100, 100, [[50, 50, 51, 51]])), true);
  assert.equal(hasInk(page(100, 100, [[0, 0, 100, 100, 245]])), false);
});

test('ink is looked for inside a box, with a pixel of slack', () => {
  const img = page(100, 100, [[50, 50, 52, 52]]);
  assert.equal(hasInk(img, { x0: 0, y0: 0, x1: 0.2, y1: 0.2 }), false);
  assert.equal(hasInk(img, { x0: 0.45, y0: 0.45, x1: 0.5, y1: 0.5 }), true);
});

test('a blank page is broken only when it has something to show', () => {
  const blank = page(100, 100);
  assert.equal(looksBroken(blank, []), false, 'an empty page is fine');
  assert.equal(looksBroken(blank, [line(10)]), true, 'blank with text is broken');
  assert.equal(looksBroken(blank, [], true), true, 'blank with pictures is broken');
});

test('a page whose text all left a mark is fine', () => {
  const img = page(100, 100, lines.map((b) => [10, b.y0 * 100, 90, b.y1 * 100]));
  assert.equal(looksBroken(img, lines), false);
});

test('a page with only its pictures (text gone) is broken', () => {
  const img = page(100, 100, [[20, 80, 60, 98]]);
  assert.equal(looksBroken(img, lines), true);
});

test('some missing words are tolerated; most missing is broken', () => {
  const half = page(100, 100, lines.slice(0, 6).map((b) => [10, b.y0 * 100, 90, b.y1 * 100]));
  assert.equal(looksBroken(half, lines), false);
  const few = page(100, 100, lines.slice(0, 3).map((b) => [10, b.y0 * 100, 90, b.y1 * 100]));
  assert.equal(looksBroken(few, lines), true);
});

test('pages with little text are judged only on being blank', () => {
  const img = page(100, 100, [[20, 80, 60, 98]]);
  assert.equal(looksBroken(img, lines.slice(0, 4)), false);
  assert.equal(looksBroken(null, lines), false, 'an unreadable canvas is never called broken');
});
