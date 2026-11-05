/* Shared helpers for the NCE section. */
(function () {
  'use strict';

  const NCE = {};

  NCE.json = async function (url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  };

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  NCE.esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ESC[c]);
  };

  NCE.fmtTime = function (seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const total = Math.floor(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  NCE.fmtNum = function (n) {
    return Number(n || 0).toLocaleString('en-US');
  };

  NCE.get = function (key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  };

  NCE.set = function (key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  };

  NCE.roman = function (n) {
    return ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][n] || String(n);
  };

  NCE.readLast = function () {
    try {
      const v = JSON.parse(NCE.get('nceLast', 'null'));
      return v && v.id ? v : null;
    } catch (e) {
      return null;
    }
  };

  NCE.saveLast = function (id) {
    NCE.set('nceLast', JSON.stringify({ id, at: Date.now() }));
  };

  NCE.lastBook = function () {
    const last = NCE.readLast();
    if (!last) return null;
    const m = /^(nce\d)-/.exec(last.id);
    return m ? m[1] : null;
  };

  let clip = null;
  NCE.stopClip = function () {
    if (clip) clip.pause();
  };
  NCE.playClip = function (src, fallback) {
    if (!src && !fallback) return Promise.resolve(false);
    if (!clip) {
      clip = new Audio();
      clip.preload = 'none';
    }
    clip.pause();
    clip.src = src || fallback;
    return clip.play().then(
      () => true,
      () => {
        if (fallback && src && fallback !== src) {
          clip.src = fallback;
          return clip.play().then(() => true, () => false);
        }
        return false;
      }
    );
  };

  NCE.markSpeaking = function (el) {
    if (!el) return;
    document.querySelectorAll('.is-speaking').forEach((n) => n.classList.remove('is-speaking'));
    el.classList.add('is-speaking');
    clearTimeout(NCE._speakTimer);
    NCE._speakTimer = setTimeout(() => el.classList.remove('is-speaking'), 900);
  };

  NCE.reduceMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  NCE.speakerIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.4L12 18.5v-13L7.4 9.5H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';

  NCE.playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.4v13.2L19 12 8 5.4Z" fill="currentColor"/></svg>';

  NCE.arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="m13 6 6 6-6 6"/></svg>';

  window.NCE = NCE;
})();
