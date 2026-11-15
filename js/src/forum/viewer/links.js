/*
 * A PDF's links, as plain anchors over the page. pdf.js's annotation layer
 * stays off (it would also wire up forms and actions): only Link annotations
 * are read, and only web and mail addresses or places in the same document
 * become links.
 */

const SCHEMES = ['http:', 'https:', 'mailto:'];

/** The address when it is an absolute http, https or mailto URL, else null. */
export function safeUrl(raw) {
  if (typeof raw !== 'string') return null;
  // Control characters and whitespace are dropped first, as browsers do, so "java\tscript:" can't slip by.
  const cleaned = raw.replace(/[\u0000- \u007f-\u009f]/g, '');
  try {
    const url = new URL(cleaned);
    return SCHEMES.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** The 1-based page a link's destination points at, or null. */
export async function destinationPage(doc, dest) {
  try {
    const explicit = typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    const target = Array.isArray(explicit) ? explicit[0] : null;
    if (Number.isInteger(target)) return target + 1;
    if (target && typeof target === 'object') return (await doc.getPageIndex(target)) + 1;
  } catch {}
  return null;
}

/**
 * The page's links as one layer (null when it has none), placed in percentages of the page, so
 * they stay on their words at any zoom, pinch or phone width. `t` gives the
 * strings; `onPage` jumps to a page in the document.
 */
export async function renderLinks({ page, doc, viewport, t, onPage }) {
  const annotations = await page.getAnnotations({ intent: 'display' }).catch(() => []);
  const layer = document.createElement('div');
  layer.className = 'Lectern-links';

  for (const a of annotations) {
    if (a.subtype !== 'Link' || !Array.isArray(a.rect)) continue;

    const url = safeUrl(a.url);
    if (!url && !a.dest) continue;

    const link = document.createElement('a');
    // The page's rectangle in viewport pixels, through the viewport's transform (it carries scale and /Rotate).
    const [ta, tb, tc, td, te, tf] = viewport.transform;
    const [x1, y1, x2, y2] = [
      ta * a.rect[0] + tc * a.rect[1] + te,
      tb * a.rect[0] + td * a.rect[1] + tf,
      ta * a.rect[2] + tc * a.rect[3] + te,
      tb * a.rect[2] + td * a.rect[3] + tf,
    ];
    Object.assign(link.style, {
      left: (Math.min(x1, x2) / viewport.width) * 100 + '%',
      top: (Math.min(y1, y2) / viewport.height) * 100 + '%',
      width: (Math.abs(x2 - x1) / viewport.width) * 100 + '%',
      height: (Math.abs(y2 - y1) / viewport.height) * 100 + '%',
    });

    if (url) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer nofollow ugc';
      link.title = url;
      link.setAttribute('aria-label', url);
    } else {
      link.href = '#';
      link.setAttribute('aria-label', t('link_internal'));
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const n = await destinationPage(doc, a.dest);
        if (n) onPage(n);
      });
      destinationPage(doc, a.dest).then((n) => n && link.setAttribute('aria-label', t('link_page', { number: n })));
    }
    layer.appendChild(link);
  }

  return layer.childElementCount ? layer : null;
}
