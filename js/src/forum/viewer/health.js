/*
 * Checks that a drawn page really shows something. Some browsers (Firefox on
 * some Macs, for one) can hand back a canvas that stayed blank or lost its text
 * while the render itself "succeeded"; the viewer then redraws in a safer mode.
 */

/** Width of the small copy the checks read; a full page readback would cost far more. */
const SAMPLE_WIDTH = 240;

/**
 * A small copy of the canvas, as { data, width, height }. Null when it can't be read.
 * The copy is shrunk where the page was drawn, so only the small copy is read back
 * (a full GPU readback costs Firefox ~17 ms a page); `cpu` keeps it off the GPU, for safe mode.
 */
export function sample(canvas, cpu = false) {
  if (!canvas.width || !canvas.height) return null;
  const width = Math.min(SAMPLE_WIDTH, canvas.width);
  const height = Math.max(1, Math.round((width * canvas.height) / canvas.width));
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = height;
  const ctx = copy.getContext('2d', cpu ? { willReadFrequently: true } : undefined);
  ctx.drawImage(canvas, 0, 0, width, height);
  try {
    return ctx.getImageData(0, 0, width, height);
  } catch {
    return null;
  }
}

/** Whether any pixel inside the box (fractions of the image, 0–1) is drawn and not white. */
export function hasInk(img, box = { x0: 0, y0: 0, x1: 1, y1: 1 }) {
  const { data, width, height } = img;
  // One pixel of slack each way: small text shrinks to a pixel or two in the copy.
  const left = Math.max(0, Math.floor(box.x0 * width) - 1);
  const right = Math.min(width, Math.ceil(box.x1 * width) + 1);
  const top = Math.max(0, Math.floor(box.y0 * height) - 1);
  const bottom = Math.min(height, Math.ceil(box.y1 * height) + 1);
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 16 && (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240)) return true;
    }
  }
  return false;
}

/**
 * Whether a drawn page looks broken. `boxes` are where the page's text sits
 * (fractions of the page); `paints` says the page draws text or pictures.
 * A page is broken when it came out blank although it has something to show,
 * or when most of its text left no mark.
 */
export function looksBroken(img, boxes, paints = false) {
  if (!img) return false;
  if (!hasInk(img)) return boxes.length > 0 || paints;
  if (boxes.length < 8) return false;
  const inked = boxes.filter((box) => hasInk(img, box)).length;
  return inked < boxes.length / 3;
}

/** Up to `max` text boxes from a drawn text layer, spread across the page, as fractions of it. */
export function textBoxes(container, divs, strings, max = 40) {
  const items = [];
  divs.forEach((div, i) => strings[i]?.trim() && items.push(div));
  if (!items.length) return [];
  const page = container.getBoundingClientRect();
  if (!page.width || !page.height) return [];
  const step = Math.max(1, items.length / max);
  const boxes = [];
  for (let k = 0; k < items.length && boxes.length < max; k += step) {
    const r = items[Math.floor(k)].getBoundingClientRect();
    if (!r.width || !r.height) continue;
    boxes.push({
      x0: (r.left - page.left) / page.width,
      y0: (r.top - page.top) / page.height,
      x1: (r.right - page.left) / page.width,
      y1: (r.bottom - page.top) / page.height,
    });
  }
  return boxes;
}

/** Whether the page draws any text or pictures. Only asked when a page came out blank. */
export async function paintsSomething(lib, page) {
  const { OPS } = lib;
  // pdf.js numbers its text operators, and its image operators, as two runs.
  const paints = (code) =>
    (code >= OPS.showText && code <= OPS.nextLineSetSpacingShowText) || (code >= OPS.paintImageMaskXObject && code <= OPS.paintSolidColorImageMask);
  return (await page.getOperatorList()).fnArray.some(paints);
}
