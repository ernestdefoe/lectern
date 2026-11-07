import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import CommentPost from 'flarum/forum/components/CommentPost';

/*
 * This file is all a page without an open PDF pays for: it finds the PDFs in a
 * post and gives each a View button. The viewer and pdf.js load on the first
 * click.
 */

const t = (key, params) => app.translator.trans('ernestdefoe-lectern.forum.' + key, params, true);

function button(className, label, text) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'Button hasIcon ' + className;
  el.setAttribute('aria-label', label);
  el.innerHTML = '<i class="icon fas fa-eye" aria-hidden="true"></i>';
  if (text) {
    const span = document.createElement('span');
    span.className = 'Button-label';
    span.textContent = text;
    el.appendChild(span);
  }
  return el;
}

/** A link to a PDF on this forum, or null. */
function samePdf(href) {
  try {
    const url = new URL(href, location.href);
    return url.origin === location.origin && /\.pdf$/i.test(url.pathname) ? url : null;
  } catch {
    return null;
  }
}

/** The link text when it names the file, else the file name without FoF Upload's timestamp prefix. */
function fileName(a, url) {
  const text = a.textContent.trim();
  if (/\.pdf$/i.test(text) && !text.includes('/')) return text;
  let name = url.pathname.split('/').pop();
  try {
    name = decodeURIComponent(name);
  } catch {}
  return name.replace(/^\d{9,}-\d+-(?=.)/, '');
}

/** Finds the PDFs in one post and adds the View buttons. Safe to run on every redraw. */
function enhance(post) {
  const mode = app.forum.attribute('lecternMode');
  const body = post.element?.querySelector('.Post-body');
  if (!mode || !body) return;

  const model = post.attrs.post;
  const discussion = model.discussion();
  const canDownload = app.forum.attribute('fof-upload.canDownload') && discussion?.attribute('canDownloadFiles') !== false;
  const fofUrl = (uuid) =>
    `${app.forum.attribute('apiUrl')}/fof/download/${encodeURIComponent(uuid)}/${encodeURIComponent(model.id())}/${encodeURIComponent(app.session.csrfToken)}`;

  const add = (el, source, place) => {
    el.dataset.lectern = '1';
    const name = source.name;
    const b = button(place.className, t('view_file', { name }), place.text ? t('view') : '');
    b.addEventListener('click', (e) => {
      // Inside FoF Upload's button group, its download handler must not fire too.
      e.stopPropagation();
      open(post, b, source, place.after);
    });
    place.insert(b);
  };

  // Lectern's own FoF Upload template.
  body.querySelectorAll('.LecternCard[data-lectern-uuid]:not([data-lectern])').forEach((card) => {
    const download = card.querySelector('.LecternCard-download');
    if (download) {
      download.setAttribute('role', 'button');
      download.setAttribute('tabindex', '0');
      download.setAttribute('aria-label', t('download'));
      download.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          download.click();
        }
      });
    }
    if (!canDownload) return;
    add(
      card,
      { url: fofUrl(card.dataset.lecternUuid), name: card.querySelector('.LecternCard-name')?.textContent || 'PDF' },
      {
        className: 'Button--primary LecternCard-view',
        text: true,
        after: card,
        insert: (b) => card.querySelector('.LecternCard-actions')?.prepend(b),
      }
    );
  });

  // FoF Upload's plain "file" template, for PDFs posted before this template.
  if (canDownload) {
    body.querySelectorAll('.ButtonGroup[data-fof-upload-download-uuid]:not([data-lectern])').forEach((group) => {
      const name = group.querySelector('.fof-upload-download-label')?.textContent.trim() || '';
      if (!/\.pdf$/i.test(name)) return;
      add(
        group,
        { url: fofUrl(group.dataset.fofUploadDownloadUuid), name },
        {
          className: 'LecternView',
          text: true,
          after: group,
          insert: (b) => group.append(b),
        }
      );
    });
  }

  // Plain links to a PDF on this forum, from any editor.
  body.querySelectorAll('a[href]:not([data-lectern])').forEach((a) => {
    const url = samePdf(a.getAttribute('href'));
    if (!url || a.closest('.LecternCard, .Lectern, [data-fof-upload-download-uuid]')) return;
    // FoF Upload's own files follow its download permission, even as links.
    if (!canDownload && app.forum.attribute('fof-upload.canDownload') !== undefined && url.pathname.includes('/assets/files/')) return;
    add(
      a,
      { url: url.href, name: fileName(a, url) },
      {
        className: 'Button--icon Button--link LecternLink-view',
        text: false,
        after: a.closest('p, li, blockquote, td, h1, h2, h3, h4, h5, h6') || a,
        insert: (b) => a.after(b),
      }
    );
  });
}

function open(post, trigger, source, after) {
  const viewers = post.lecternOpen || (post.lecternOpen = new Map());
  const current = viewers.get(trigger);
  if (current) return current.close();

  const inline = app.forum.attribute('lecternMode') === 'inline' && !window.matchMedia('(max-width: 767px)').matches;

  trigger.setAttribute('aria-busy', 'true');
  import('./viewer/open')
    .then(({ default: openViewer }) => {
      const handle = openViewer({
        ...source,
        trigger,
        after: inline ? after : null,
        onClose: () => viewers.delete(trigger),
      });
      viewers.set(trigger, handle);
    })
    .catch(() => window.open(source.url))
    .finally(() => trigger.removeAttribute('aria-busy'));
}

/** Closes the inline viewers of a post whose content was replaced or removed. */
function prune(post, all) {
  post.lecternOpen?.forEach((handle) => (all || !handle.isConnected()) && handle.close());
}

app.initializers.add('ernestdefoe-lectern', () => {
  extend(CommentPost.prototype, 'oncreate', function () {
    enhance(this);
  });
  extend(CommentPost.prototype, 'onupdate', function () {
    prune(this, false);
    enhance(this);
  });
  extend(CommentPost.prototype, 'onremove', function () {
    prune(this, true);
  });
});
