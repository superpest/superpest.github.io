/* =========================================================
   书虫 · 爱情与金钱 — 应用逻辑
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- 小工具 ---------------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pad2 = n => String(n).padStart(2, '0');
  const fmtTime = s => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${pad2(ss)}`;
  };
  const escapeHtml = str => String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const debounce = (fn, ms) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };
  const uid = () => Math.random().toString(36).slice(2, 9);

  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    },
    del(key) { try { localStorage.removeItem(key); } catch {} }
  };

  /* ---------------- 全局状态 ---------------- */
  const DEFAULTS = { theme: 'paper', mode: 'both', size: 19, lh: 1.85, ttsRate: 0.9, autoNext: true, autoSpeak: true };

  const state = {
    chapters: [],
    byId: new Map(),
    settings: Object.assign({}, DEFAULTS, store.get('bw.settings', {})),
    progress: store.get('bw.progress', {}),   // { chapterId: { p, total, done, updated } }
    vocab: store.get('bw.vocab', []),
    minutes: store.get('bw.minutes', 0),
    lastId: store.get('bw.last', null),
    route: '/',
    chapter: null,
    activePair: 0,
    audio: { mode: 'none', url: null, el: null },
    tts: { on: false, paused: false, idx: 0, utter: null },
    loop: { a: null, b: null, on: false },
    sleep: { until: 0, timer: 0 },
    dictCache: store.get('bw.dict', {}),
    pendingWord: null
  };

  const saveSettings = () => store.set('bw.settings', state.settings);
  const saveProgress = () => store.set('bw.progress', state.progress);
  const saveVocab = () => { store.set('bw.vocab', state.vocab); updateVocabBadges(); };

  /* ---------------- 图标 / 模板片段 ---------------- */
  const svg = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5.5v13a.8.8 0 0 0 1.22.68l10.2-6.5a.8.8 0 0 0 0-1.36L9.22 4.82A.8.8 0 0 0 8 5.5Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>',
    speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>'
  };

  /* ---------------- 设置应用 ---------------- */
  function applySettings() {
    const s = state.settings;
    const html = document.documentElement;
    html.dataset.theme = s.theme;
    html.dataset.mode = s.mode;
    html.style.setProperty('--read-size', s.size + 'px');
    html.style.setProperty('--read-lh', s.lh);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', s.theme === 'dark' ? '#131517' : s.theme === 'sepia' ? '#f3e7d1' : '#f7f3ea');

    $$('#modeSeg button, #modeSegSheet button').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === s.mode);
      b.setAttribute('aria-pressed', String(b.dataset.mode === s.mode));
    });
    $$('#lhSeg button').forEach(b => {
      b.classList.toggle('active', parseFloat(b.dataset.lh) === s.lh);
    });
    $$('.theme-swatch').forEach(b => {
      b.classList.toggle('active', b.dataset.themeOpt === s.theme);
    });

    const sizeRange = $('#sizeRange'), sizeRange2 = $('#sizeRange2');
    if (sizeRange) sizeRange.value = s.size;
    if (sizeRange2) sizeRange2.value = s.size;
    $('#sizeVal').textContent = s.size;
    $('#sizeVal2').textContent = s.size + ' px';
    $('#speedRange').value = Math.round(s.ttsRate * 100);
    $('#speedVal').textContent = s.ttsRate.toFixed(2).replace(/0$/, '') + '×';
    $('#autoNext').checked = !!s.autoNext;
    $('#autoSpeak').checked = !!s.autoSpeak;
    saveSettings();
  }

  /* ---------------- 路由 ---------------- */
  function parseRoute() {
    const h = location.hash.replace(/^#/, '') || '/';
    return h;
  }

  function setView(name) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    $$('.nav a').forEach(a => a.classList.toggle('active',
      (name === 'home' && a.dataset.nav === 'home') || (name === 'vocab' && a.dataset.nav === 'vocab')));
    if (name !== 'read') {
      const player = $('#player');
      if (player) player.hidden = true;
      if (typeof audio !== 'undefined') audio.pause();
      stopTTS();
      if (window.__readerScroll) {
        window.removeEventListener('scroll', window.__readerScroll);
        window.__readerScroll = null;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }

  function route() {
    const h = parseRoute();
    state.route = h;

    const readMatch = h.match(/^\/read\/([^/?]+)/);
    if (readMatch) {
      const ch = state.byId.get(readMatch[1]);
      if (!ch) return go('/');
      setView('read');
      openChapter(ch);
      return;
    }
    if (h === '/vocab' || h === '/vocab/') {
      setView('vocab');
      renderVocab();
      return;
    }
    if (h === '/' || h === '') {
      setView('home');
      renderHome();
      return;
    }
    setView('notfound');
  }

  const go = (path) => { location.hash = '#' + path; };

  function openChapter(ch, opts = {}) {
    state.chapter = ch;
    state.lastId = ch.id;
    store.set('bw.last', ch.id);
    renderChapter(ch, opts);
  }

  /* ---------------- 首页 ---------------- */
  function chapterPct(ch) {
    const p = state.progress[ch.id];
    if (!p) return 0;
    if (p.done) return 1;
    const total = ch.paragraphs.length || 1;
    return clamp((p.p || 0) / total, 0, 1);
  }

  function progressSummary() {
    let sum = 0, done = 0;
    state.chapters.forEach(ch => {
      const pct = chapterPct(ch);
      sum += pct;
      if (pct >= 1) done++;
    });
    return { pct: Math.round((sum / Math.max(1, state.chapters.length)) * 100), done };
  }

  function previewOf(ch) {
    const p = ch.paragraphs.find(x => x.en) || ch.paragraphs[0];
    const t = (p && (p.en || p.zh)) || '';
    return t;
  }

  function renderHome() {
    const { pct, done } = progressSummary();
    $('#statDone').textContent = done;
    $('#statPct').innerHTML = `${pct}<span class="stat-unit">%</span>`;
    $('#statWords').textContent = state.vocab.length;
    $('#statTime').innerHTML = `${Math.round(state.minutes)}<span class="stat-unit">分</span>`;

    const last = state.byId.get(state.lastId);
    const label = $('#continueLabel');
    const btn = $('#continueBtn');
    if (last && chapterPct(last) > 0.02) {
      label.textContent = `继续 ${last.title}`;
      btn.onclick = () => go(`/read/${last.id}`);
    } else {
      label.textContent = '开始学习';
      btn.onclick = () => go('/read/89691761');
    }

    const list = $('#tocList');
    list.innerHTML = '';
    state.chapters.forEach((ch, i) => {
      const pctCh = chapterPct(ch);
      const doneCh = pctCh >= 1;
      const active = ch.id === state.lastId && pctCh > 0;
      const li = document.createElement('li');
      const stateText = doneCh ? '已完成' : pctCh > 0 ? '阅读中' : '未读';
      li.innerHTML = `
        <a class="toc-item ${doneCh ? 'done' : ''} ${active ? 'active' : ''}" href="#/read/${ch.id}">
          <span class="toc-num">${ch.index === 0 ? '00' : pad2(ch.index)}</span>
          <span class="toc-main">
            <span class="toc-title">${escapeHtml(ch.title)}</span>
            <span class="toc-sub">${escapeHtml(previewOf(ch).slice(0, 46))}${previewOf(ch).length > 46 ? '…' : ''}</span>
          </span>
          <span class="toc-side">
            <span>${ch.paragraphs.length} 段</span>
            <span>${ch.audio ? ch.audio.hsize : '无音频'}</span>
          </span>
          <span class="toc-progress"><i style="width:${Math.round(pctCh * 100)}%"></i></span>
        </a>`;
      li.querySelector('.toc-side').insertAdjacentHTML('beforeend',
        `<span class="toc-state">${stateText}</span>`);
      list.appendChild(li);
    });
  }

  /* ---------------- 阅读器 ---------------- */
  const scrollState = { ticking: false, pendingSave: null };

  function artKicker(ch) {
    if (ch.index === 0) return 'INTRODUCTION · 简介';
    return `CHAPTER ${pad2(ch.index)} · 第 ${ch.index} 章`;
  }

  function renderChapter(ch, opts = {}) {
    $('#view-read').classList.add('active');

    $('#artKicker').textContent = artKicker(ch);
    $('#artTitle').textContent = ch.title;
    const bits = [`${ch.paragraphs.length} 段`];
    const hasEn = ch.paragraphs.some(p => p.en);
    const hasZh = ch.paragraphs.some(p => p.zh);
    bits.push(hasEn ? (hasZh ? '中英对照' : '英文') : '中文');
    if (ch.audio) bits.push(`音频 ${ch.audio.hsize}`);
    $('#artMeta').textContent = bits.join(' · ');

    // 左侧目录
    const nav = $('#railNav');
    nav.innerHTML = '';
    state.chapters.forEach(c => {
      const pct = chapterPct(c);
      const a = document.createElement('a');
      a.className = 'rail-link' + (c.id === ch.id ? ' active' : '') + (pct >= 1 ? ' done' : '');
      a.href = `#/read/${c.id}`;
      a.innerHTML = `<span class="n">${c.index === 0 ? '00' : pad2(c.index)}</span><span>${escapeHtml(c.title)}</span>`;
      nav.appendChild(a);
    });

    // 正文
    const pairs = $('#pairs');
    pairs.innerHTML = '';
    let firstEn = true;
    ch.paragraphs.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'pair';
      div.dataset.i = i;
      if (p.en && firstEn) { div.classList.add('first'); firstEn = false; }
      if (p.en) div.innerHTML += `<p class="en" lang="en">${escapeHtml(p.en)}</p>`;
      if (p.zh) div.innerHTML += `<p class="zh" lang="zh-CN">${escapeHtml(p.zh)}</p>`;
      pairs.appendChild(div);
    });

    // 上一章 / 下一章
    const idx = ch.index;
    const next = state.chapters.find(c => c.index === idx + 1);
    const prev = state.chapters.find(c => c.index === idx - 1);
    const nextBtn = $('#nextChapterBtn');
    const doneBtn = $('#markDoneBtn');
    nextBtn.textContent = next ? `下一章 · ${next.title}` : '回到目录';
    nextBtn.onclick = () => next ? go(`/read/${next.id}`) : go('/');
    const p = state.progress[ch.id];
    doneBtn.textContent = p && p.done ? '已读本章 ✓' : '标记为已读';
    doneBtn.classList.toggle('done-state', !!(p && p.done));
    doneBtn.onclick = () => {
      const rec = state.progress[ch.id] || { p: 0, total: ch.paragraphs.length };
      rec.done = !(rec.done);
      rec.updated = Date.now();
      state.progress[ch.id] = rec;
      saveProgress();
      renderChapter(ch, { keepScroll: true });
      toast(rec.done ? '已标记为读完' : '已取消标记');
    };

    // 右栏
    renderMiniVocab(ch);
    $('#chapterWordsCount').textContent = state.vocab.filter(v => v.chapterId === ch.id).length;

    // 播放器
    setupPlayerForChapter(ch);

    // 恢复阅读位置
    const rec = state.progress[ch.id];
    if (!opts.keepScroll) {
      const target = opts.startAt != null ? opts.startAt : (rec && rec.p ? rec.p : 0);
      requestAnimationFrame(() => {
        const el = pairs.querySelector(`.pair[data-i="${target}"]`);
        if (el && target > 0) {
          const top = el.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top, behavior: 'auto' });
          toast('已回到上次读到的位置');
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      });
    }

    // 记录进度：滚动位置（节流）
    const onScroll = () => {
      if (scrollState.ticking) return;
      scrollState.ticking = true;
      requestAnimationFrame(() => {
        scrollState.ticking = false;
        const elements = $$('.pair', pairs);
        let active = 0;
        const line = 180;
        for (const el of elements) {
          if (el.getBoundingClientRect().top <= line) active = +el.dataset.i;
          else break;
        }
        state.activePair = active;
        elements.forEach(el => el.classList.toggle('active', +el.dataset.i === active));
        scheduleSaveProgress(active);
      });
    };
    window.removeEventListener('scroll', window.__readerScroll || (() => {}));
    window.__readerScroll = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const scheduleSaveProgress = debounce((idx) => {
    const ch = state.chapter;
    if (!ch) return;
    const rec = state.progress[ch.id] || { p: 0, total: ch.paragraphs.length };
    if (idx > (rec.p || 0)) rec.p = idx;
    rec.total = ch.paragraphs.length;
    rec.updated = Date.now();
    if (rec.p / ch.paragraphs.length > 0.96) rec.done = true;
    state.progress[ch.id] = rec;
    saveProgress();
  }, 900);

  function renderMiniVocab(ch) {
    const wrap = $('#miniVocab');
    const items = state.vocab.filter(v => v.chapterId === ch.id).slice(-8).reverse();
    if (!items.length) {
      wrap.innerHTML = '<p class="mini-empty">点按正文里的任意英文单词，查义并收藏到这里。</p>';
      return;
    }
    wrap.innerHTML = items.map(v => `
      <button class="mini-word" data-word="${escapeHtml(v.word)}" type="button">
        <span>${escapeHtml(v.word)}</span>
        <span>${escapeHtml((v.zh || v.def || '').slice(0, 18))}</span>
      </button>`).join('');
    $$('.mini-word', wrap).forEach(b => b.onclick = () => {
      const v = state.vocab.find(x => x.word === b.dataset.word);
      if (v) showWordPopFor(v);
    });
  }

  /* ---------------- 查词 ---------------- */
  const WORD_RE = /[A-Za-z][A-Za-z'’-]*/;

  function wordAtPoint(x, y) {
    let range;
    if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) range = { startContainer: pos.offsetNode, startOffset: pos.offset };
    }
    if (!range || !range.startContainer || range.startContainer.nodeType !== 3) return null;
    const node = range.startContainer;
    if (!node.parentElement.closest('.en')) return null;
    const text = node.textContent;
    let start = range.startOffset, end = range.startOffset;
    const isW = c => /[A-Za-z'’-]/.test(c);
    while (start > 0 && isW(text[start - 1])) start--;
    while (end < text.length && isW(text[end])) end++;
    let word = text.slice(start, end).replace(/^[-’']+|[-’']+$/g, '');
    if (word.length < 2 || !/[A-Za-z]/.test(word)) return null;
    return { word: word.toLowerCase(), display: word, sentence: node.parentElement.textContent.trim() };
  }

  async function lookupWord(word) {
    const cache = state.dictCache[word];
    if (cache) return cache;
    const out = { phon: '', pos: '', def: '', zh: '' };

    const timeouts = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

    const dictP = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: timeouts(4500) })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
    const zhP = fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`, { signal: timeouts(4500) })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    const [dict, zh] = await Promise.all([dictP, zhP]);
    if (Array.isArray(dict) && dict[0]) {
      const entry = dict[0];
      out.phon = entry.phonetic || (entry.phonetics || []).find(p => p.text)?.text || '';
      const meaning = (entry.meanings || [])[0];
      if (meaning) {
        out.pos = meaning.partOfSpeech || '';
        out.def = (meaning.definitions || [])[0]?.definition || '';
      }
    }
    if (zh && zh.responseStatus == 200) {
      const t = zh.responseData?.translatedText || '';
      if (t && !/^NO QUERY|MYMEMORY WARNING/i.test(t) && t.toLowerCase() !== word.toLowerCase()) out.zh = t;
    }
    if (out.phon || out.def || out.zh) {
      state.dictCache[word] = out;
      const keys = Object.keys(state.dictCache);
      if (keys.length > 400) delete state.dictCache[keys[0]];
      store.set('bw.dict', state.dictCache);
    }
    return out;
  }

  let popTimer = 0;
  function showWordPop({ word, display, sentence, x, y, saved }) {
    const pop = $('#wordPop');
    state.pendingWord = { word, display, sentence };
    pop.hidden = false;
    $('#wpWord').textContent = display || saved?.word || word;
    $('#wpPhon').textContent = '';
    $('#wpPos').textContent = '';
    $('#wpDef').textContent = saved ? (saved.zh || saved.def || '') : '正在查询…';
    $('#wpCtx').textContent = sentence ? `“${sentence}”` : '';
    $('#wpSave').textContent = state.vocab.some(v => v.word.toLowerCase() === word) ? '已收藏 · 可编辑' : '收入生词本';

    const w = pop.offsetWidth || 320, h = pop.offsetHeight || 220;
    let left = x - w / 2;
    left = clamp(left, 12, window.innerWidth - w - 12);
    let top = y + 18;
    if (top + h > window.innerHeight - 12) top = Math.max(12, y - h - 18);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';

    // 点选即读：点击本身是用户手势，可直接朗读
    if (state.settings.autoSpeak) speakWord(display || saved?.word || word);

    if (saved) return;
    clearTimeout(popTimer);
    popTimer = setTimeout(async () => {
      const res = await lookupWord(word);
      if (state.pendingWord?.word !== word) return;
      $('#wpPhon').textContent = res.phon || '';
      $('#wpPos').textContent = res.pos || '';
      $('#wpDef').textContent = res.zh || res.def || '暂无释义，可手动补充';
      if (!res.zh && res.def) {
        $('#wpDef').textContent = res.def;
      }
      state.pendingWord.dict = res;
    }, 60);
  }

  function showWordPopFor(v) {
    const x = window.innerWidth / 2, y = 120;
    showWordPop({ word: v.word.toLowerCase(), display: v.word, sentence: v.sentence, x, y, saved: v });
  }

  function hideWordPop() { $('#wordPop').hidden = true; state.pendingWord = null; }

  $('#wpClose').onclick = hideWordPop;
  document.addEventListener('pointerdown', (e) => {
    const pop = $('#wordPop');
    if (!pop.hidden && !pop.contains(e.target)) hideWordPop();
  });

  $('#wpSpeak').onclick = () => speakWord($('#wpWord').textContent);
  $('#wpSpeakTop').onclick = () => speakWord($('#wpWord').textContent);

  $('#wpSave').onclick = () => {
    const w = state.pendingWord;
    if (!w) return;
    const existing = state.vocab.find(v => v.word.toLowerCase() === w.word);
    const dict = w.dict || state.dictCache[w.word] || {};
    if (existing) {
      openMeaningDialog(existing);
      hideWordPop();
      return;
    }
    const rec = {
      id: uid(), word: w.display || w.word, phon: dict.phon || '',
      def: dict.def || '', zh: dict.zh || '', pos: dict.pos || '',
      sentence: w.sentence || '', chapterId: state.chapter?.id || '',
      chapterTitle: state.chapter?.title || '',
      learned: false, ts: Date.now()
    };
    if (!rec.zh && !rec.def) {
      openMeaningDialog(rec, true);
      hideWordPop();
      return;
    }
    state.vocab.push(rec);
    saveVocab();
    hideWordPop();
    toast(`已收藏 “${rec.word}”`);
    if (state.route.startsWith('/read/') && state.chapter) {
      renderMiniVocab(state.chapter);
      $('#chapterWordsCount').textContent = state.vocab.filter(v => v.chapterId === state.chapter.id).length;
    }
  };

  // 手动补充释义
  function openMeaningDialog(rec, isNew) {
    const dlg = $('#meaningDialog');
    $('#mdWord').textContent = rec.word;
    $('#mdInput').value = rec.zh || rec.def || '';
    dlg.dataset.mode = isNew ? 'new' : 'edit';
    dlg.__rec = rec;
    dlg.showModal();
    setTimeout(() => $('#mdInput').focus(), 40);
  }
  $('#meaningDialog').addEventListener('close', () => {
    const dlg = $('#meaningDialog');
    if (dlg.returnValue !== 'save') return;
    const val = $('#mdInput').value.trim();
    if (!val) return;
    const rec = dlg.__rec;
    if (dlg.dataset.mode === 'new') {
      rec.zh = val;
      state.vocab.push(rec);
      saveVocab();
      toast(`已收藏 “${rec.word}”`);
    } else {
      rec.zh = val;
      saveVocab();
      toast('释义已更新');
    }
    if (state.route.startsWith('/read/') && state.chapter) renderMiniVocab(state.chapter);
  });

  /* ---------------- 生词本 ---------------- */
  function updateVocabBadges() {
    const n = state.vocab.length;
    const b = $('#navVocabCount');
    b.textContent = n;
    b.hidden = n === 0;
  }

  let vocabQuery = '';
  $('#vocabSearch')?.addEventListener('input', (e) => {
    vocabQuery = e.target.value.trim().toLowerCase();
    renderVocab();
  });

  function renderVocab() {
    const grid = $('#vocabGrid');
    const empty = $('#vocabEmpty');
    let items = state.vocab.slice().sort((a, b) => b.ts - a.ts);
    if (vocabQuery) {
      items = items.filter(v =>
        v.word.includes(vocabQuery) ||
        (v.zh || '').toLowerCase().includes(vocabQuery) ||
        (v.def || '').toLowerCase().includes(vocabQuery));
    }
    empty.hidden = state.vocab.length !== 0;
    grid.innerHTML = '';
    if (vocabQuery && !items.length) {
      grid.innerHTML = `<p class="mini-empty" style="padding:40px 0">没有匹配 “${escapeHtml(vocabQuery)}” 的单词。</p>`;
      return;
    }
    items.forEach(v => {
      const card = document.createElement('article');
      card.className = 'vocab-card' + (v.learned ? ' learned' : '');
      const sentence = v.sentence
        ? escapeHtml(v.sentence).replace(new RegExp(`\\b(${v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'ig'), '<b>$1</b>')
        : '';
      card.innerHTML = `
        <div class="vc-top">
          <span class="vc-word">${escapeHtml(v.word)}</span>
          <span class="vc-phon">${escapeHtml(v.phon || '')}</span>
        </div>
        ${v.pos ? `<p class="vc-pos wp-pos" style="margin:0">${escapeHtml(v.pos)}</p>` : ''}
        <p class="vc-def">${escapeHtml(v.zh || v.def || '（未填写释义）')}</p>
        ${v.def && v.zh ? `<p class="vc-def" style="color:var(--ink-3);font-size:12.5px">${escapeHtml(v.def)}</p>` : ''}
        ${sentence ? `<p class="vc-src">${sentence}</p>` : ''}
        <div class="vc-foot">
          <span class="vc-chapter">${escapeHtml(v.chapterTitle || '')}</span>
          <span class="vc-actions">
            <button class="icon-btn" data-act="speak" title="读音">${svg.speak}</button>
            <button class="icon-btn ${v.learned ? 'vc-known' : ''}" data-act="learn" title="${v.learned ? '标记为未掌握' : '标记为掌握'}">${svg.check}</button>
            <button class="icon-btn danger" data-act="del" title="删除">${svg.trash}</button>
          </span>
        </div>`;
      card.querySelector('[data-act="speak"]').onclick = () => speakWord(v.word);
      card.querySelector('[data-act="learn"]').onclick = () => {
        v.learned = !v.learned;
        saveVocab();
        renderVocab();
      };
      card.querySelector('[data-act="del"]').onclick = () => {
        state.vocab = state.vocab.filter(x => x.id !== v.id);
        saveVocab();
        renderVocab();
        toast('已删除');
      };
      grid.appendChild(card);
    });
  }

  $('#clearVocabBtn')?.addEventListener('click', () => {
    if (!state.vocab.length) return;
    if (!confirm('确定清空生词本吗？此操作不可恢复。')) return;
    state.vocab = [];
    saveVocab();
    renderVocab();
    toast('生词本已清空');
  });

  $('#exportBtn')?.addEventListener('click', () => {
    if (!state.vocab.length) return toast('生词本还是空的');
    const rows = [['word', 'phonetic', 'definition_zh', 'definition_en', 'chapter', 'sentence']];
    state.vocab.forEach(v => rows.push([v.word, v.phon, v.zh, v.def, v.chapterTitle, v.sentence]));
    const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '生词本.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  /* ---------------- 复习 ---------------- */
  let review = { queue: [], idx: 0, flipped: false };
  $('#reviewBtn')?.addEventListener('click', startReview);
  function startReview() {
    if (!state.vocab.length) return toast('先收藏几个单词吧');
    review.queue = state.vocab.slice().sort(() => Math.random() - 0.5);
    review.idx = 0;
    $('#review').hidden = false;
    document.body.classList.add('no-scroll');
    renderReviewCard();
  }
  function endReview() {
    $('#review').hidden = true;
    document.body.classList.remove('no-scroll');
  }
  $('#reviewClose').onclick = endReview;
  $('#flash').onclick = () => {
    review.flipped = !review.flipped;
    $('#flash').classList.toggle('flipped', review.flipped);
  };
  function renderReviewCard() {
    const q = review.queue;
    review.flipped = false;
    $('#flash').classList.remove('flipped');
    $('#reviewDone').hidden = true;
    $('#reviewCount').textContent = `${Math.min(review.idx + 1, q.length)} / ${q.length}`;
    if (review.idx >= q.length) {
      $('#reviewDone').hidden = false;
      $('#flash').style.visibility = 'hidden';
      $('#reviewCount').textContent = `${q.length} / ${q.length}`;
      return;
    }
    $('#flash').style.visibility = 'visible';
    const v = q[review.idx];
    $('#flashWord').textContent = v.word;
    $('#flashWordBack').textContent = v.word;
    $('#flashPhon').textContent = v.phon || '';
    $('#flashDef').textContent = v.zh || v.def || '（未填写释义）';
    $('#flashSrc').textContent = v.sentence ? `“${v.sentence}”` : '';
  }
  function advanceReview(known) {
    const v = review.queue[review.idx];
    if (v && known !== undefined) {
      v.learned = known;
      if (!known) { review.queue.push(v); }
    }
    review.idx++;
    saveVocab();
    renderReviewCard();
    if (review.idx >= review.queue.length && review.queue.length) {
      setTimeout(() => { if (!$('#review').hidden) $('#reviewDone').hidden = false; }, 50);
    }
  }
  $('#reviewKnown').onclick = () => advanceReview(true);
  $('#reviewUnknown').onclick = () => advanceReview(false);

  $('#review').addEventListener('click', (e) => {
    if (e.target === $('#review')) endReview();
  });

  /* ---------------- 朗读 ---------------- */
  const ttsSupported = 'speechSynthesis' in window;
  let ttsNoticeShown = false;

  function pickVoice() {
    if (!ttsSupported) return null;
    const voices = speechSynthesis.getVoices();
    return voices.find(v => /en[-_]GB/i.test(v.lang) && /female|Serena|Kate|Sonia/i.test(v.name))
        || voices.find(v => /en[-_]GB/i.test(v.lang))
        || voices.find(v => /^en/i.test(v.lang))
        || null;
  }

  function speakWord(word) {
    if (!ttsSupported) return toast('当前浏览器不支持朗读');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-GB';
    u.rate = 0.9;
    const v = pickVoice(); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  function stopTTS() {
    if (!ttsSupported) return;
    speechSynthesis.cancel();
    state.tts.on = false;
    state.tts.paused = false;
    state.tts.k = 0;
    state.tts.total = 0;
    $('#ttsBtn')?.classList.remove('speaking');
    $$('.pair.speaking').forEach(el => el.classList.remove('speaking'));
    $('#player')?.classList.remove('tts');
    if (state.audio.mode === 'none') {
      setPlayerStatus('none');
      setTrackProgress(0);
    } else {
      setPlayerStatus('audio');
      if (audio.duration) updateTimes(audio.currentTime, audio.duration);
    }
    updatePlayUI();
  }

  function startTTS(fromIdx = 0) {
    if (!ttsSupported) return toast('当前浏览器不支持语音朗读，建议使用 Chrome / Edge / Safari');
    stopAudio();
    speechSynthesis.cancel();
    const ch = state.chapter;
    if (!ch) return;
    const hasEn = ch.paragraphs.some(p => p.en);
    const items = ch.paragraphs
      .map((p, i) => ({ p, i }))
      .filter(x => hasEn ? x.p.en : x.p.zh);
    if (!items.length) return toast('本章没有可朗读的正文');
    if (!ttsNoticeShown) {
      ttsNoticeShown = true;
      toast('没有本地音频，正在用系统语音朗读（非原声）');
    }
    state.tts.on = true;
    state.tts.paused = false;
    state.tts.total = items.length;
    let k = items.findIndex(x => x.i >= fromIdx);
    if (k < 0) k = 0;
    state.tts.k = k;
    $('#ttsBtn').classList.add('speaking');
    updatePlayUI();

    const speakNext = () => {
      if (!state.tts.on) return;
      if (k >= items.length) {
        stopTTS();
        const next = state.chapters.find(c => c.index === state.chapter.index + 1);
        if (state.settings.autoNext && next) go(`/read/${next.id}`);
        return;
      }
      const { p, i } = items[k];
      state.activePair = i;
      state.tts.k = k;
      refreshTTSStatus();
      highlightPair(i, true);
      const u = new SpeechSynthesisUtterance(hasEn ? p.en : p.zh);
      u.lang = hasEn ? 'en-GB' : 'zh-CN';
      u.rate = state.settings.ttsRate;
      if (hasEn) { const v = pickVoice(); if (v) u.voice = v; }
      u.onend = () => { k++; setTimeout(speakNext, 220); };
      u.onerror = () => { k++; setTimeout(speakNext, 120); };
      state.tts.utter = u;
      speechSynthesis.speak(u);
    };
    speakNext();
  }

  function toggleTTS() {
    if (!ttsSupported) return toast('当前浏览器不支持语音朗读');
    if (state.tts.on && !state.tts.paused) {
      speechSynthesis.pause();
      state.tts.paused = true;
      $('#ttsBtn').classList.remove('speaking');
    } else if (state.tts.on && state.tts.paused) {
      speechSynthesis.resume();
      state.tts.paused = false;
      $('#ttsBtn').classList.add('speaking');
    } else {
      startTTS(state.activePair);
      return;
    }
    refreshTTSStatus();
    updatePlayUI();
  }

  function highlightPair(i, scroll) {
    $$('.pair').forEach(el => el.classList.toggle('speaking', +el.dataset.i === i));
    if (scroll) {
      const el = $(`.pair[data-i="${i}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 80 || r.bottom > window.innerHeight - 140) {
          window.scrollTo({ top: r.top + window.scrollY - 120, behavior: 'smooth' });
        }
      }
    }
  }

  $('#ttsBtn')?.addEventListener('click', toggleTTS);

  /* ---------------- 播放器 ---------------- */
  const audio = new Audio();
  audio.preload = 'metadata';
  state.audio.el = audio;
  const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75];
  let speedIdx = 1;

  function setupPlayerForChapter(ch) {
    const player = $('#player');
    player.hidden = false;
    $('#plTitle').textContent = ch.title;
    $('#plSub').textContent = ch.audio ? '本地音频 · 检测中…' : '无原声音频';

    stopTTS();
    audio.pause();
    state.audio.mode = 'none';
    state.audio.url = null;
    player.classList.toggle('no-audio', !ch.audio);
    setPlayIcon(false);
    setTrackProgress(0);
    setPlayerStatus('none');

    if (!ch.audio) {
      // 简介等无音频章节
      $('#plSub').textContent = '无原声音频 · 点播放可朗读中文';
      updateTimes(0, 0);
      return;
    }

    loadAudioSource(ch).then(url => {
      if (!url) {
        $('#plSub').textContent = '本地缺少音频 · 点播放可朗读';
        player.classList.add('no-audio');
        setPlayerStatus('none');
        return;
      }
      state.audio.mode = 'file';
      state.audio.url = url;
      audio.src = url;
      audio.playbackRate = SPEEDS[speedIdx];
      player.classList.remove('no-audio');
      $('#plSub').textContent = '本地音频 · 已就绪';
      setPlayerStatus('audio');
    }).catch(() => {});
  }

  // 音频只从本机 audio/ 目录读取，结果缓存，避免重复探测
  const audioSources = new Map();
  async function loadAudioSource(ch) {
    if (!ch.audio) return null;
    if (audioSources.has(ch.id)) return audioSources.get(ch.id);
    const candidates = [`audio/ch${ch.index}.mp3`, `audio/${ch.audio.objectid}.mp3`];
    let found = null;
    for (const url of candidates) {
      if (await probeAudio(url)) { found = url; break; }
    }
    audioSources.set(ch.id, found);
    return found;
  }

  function probeAudio(url) {
    return new Promise(resolve => {
      const t = new Audio();
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        t.onloadedmetadata = t.onerror = null;
        resolve(ok);
      };
      t.preload = 'metadata';
      t.onloadedmetadata = () => finish(true);
      t.onerror = () => finish(false);
      setTimeout(() => finish(false), 3500);
      t.src = url;
    });
  }

  function setPlayIcon(playing) {
    $('#player')?.classList.toggle('playing', playing);
  }

  function setTrackProgress(pct) {
    pct = clamp(pct, 0, 1);
    $('#trackFill').style.width = (pct * 100) + '%';
    $('#trackKnob').style.left = (pct * 100) + '%';
    $('#track').setAttribute('aria-valuenow', String(Math.round(pct * 100)));
  }

  function updateTimes(cur, dur) {
    $('#plCur').textContent = fmtTime(cur);
    $('#plDur').textContent = fmtTime(dur);
    setTrackProgress(dur ? cur / dur : 0);
  }

  // mode: 'audio' | 'none' | 'tts'
  function setPlayerStatus(mode, k = 0, total = 0) {
    const player = $('#player');
    const status = $('#plStatus');
    if (!player || !status) return;
    player.classList.toggle('tts', mode === 'tts');
    if (mode === 'audio') { status.hidden = true; return; }
    status.hidden = false;
    const text = $('#plStatusText');
    if (mode === 'tts') {
      const label = state.tts.paused ? '已暂停' : '朗读中';
      text.textContent = `${label} · 第 ${Math.min(k + 1, total)} / ${total} 段`;
      $('#plSub').textContent = '系统语音朗读 · 非原声';
    } else {
      text.textContent = state.chapter?.audio ? '本地缺少本章音频' : '无原声音频';
      $('#plSub').textContent = state.chapter?.audio
        ? '本地缺少音频 · 点播放为系统朗读'
        : '无原声音频 · 点播放为系统朗读';
    }
  }

  function refreshTTSStatus() {
    if (!state.tts.on) return;
    const total = state.tts.total || 1;
    const k = state.tts.k || 0;
    setPlayerStatus('tts', k, total);
    setTrackProgress(total ? k / total : 0);
  }

  function updatePlayUI() {
    const playing = !!(state.tts.on && !state.tts.paused) || (!audio.paused && !audio.ended);
    setPlayIcon(playing);
  }

  audio.addEventListener('timeupdate', () => {
    if (state.audio.mode !== 'none') updateTimes(audio.currentTime, audio.duration);
    if (state.loop.on && state.loop.a != null && state.loop.b != null) {
      if (audio.currentTime >= state.loop.b) audio.currentTime = state.loop.a;
    }
  });
  audio.addEventListener('loadedmetadata', () => {
    updateTimes(audio.currentTime, audio.duration);
    $('#plSub').textContent = `本地音频 · ${fmtTime(audio.duration)}`;
  });
  audio.addEventListener('progress', () => {
    if (!audio.duration) return;
    const end = audio.buffered.length ? audio.buffered.end(audio.buffered.length - 1) : 0;
    $('#trackBuffer').style.width = clamp(end / audio.duration, 0, 1) * 100 + '%';
  });
  audio.addEventListener('play', updatePlayUI);
  audio.addEventListener('pause', updatePlayUI);
  audio.addEventListener('ended', () => {
    updatePlayUI();
    const next = state.chapters.find(c => c.index === state.chapter?.index + 1);
    if (state.settings.autoNext && next) go(`/read/${next.id}`);
  });
  audio.addEventListener('error', () => {
    if (state.audio.mode !== 'none') $('#plSub').textContent = '音频加载失败';
    updatePlayUI();
  });

  function stopAudio() { audio.pause(); }

  $('#plPlay').onclick = () => {
    const ch = state.chapter;
    if (!ch) return;
    if (state.audio.mode !== 'none') {
      if (state.tts.on) stopTTS();
      if (audio.paused) audio.play().catch(() => toast('无法播放，请检查音频文件'));
      else audio.pause();
    } else {
      toggleTTS();
    }
    setTimeout(updatePlayUI, 30);
  };

  $('#plBack').onclick = () => { if (state.audio.mode !== 'none') audio.currentTime = Math.max(0, audio.currentTime - 10); };
  $('#plFwd').onclick  = () => { if (state.audio.mode !== 'none') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); };

  const goChapter = (delta) => {
    const next = state.chapters.find(c => c.index === state.chapter.index + delta);
    if (next) go(`/read/${next.id}`);
    else toast(delta > 0 ? '已经是最后一章' : '已经是第一章');
  };
  $('#plPrev').onclick = () => goChapter(-1);
  $('#plNext').onclick = () => goChapter(1);

  $('#speedBtn').onclick = () => {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    const r = SPEEDS[speedIdx];
    audio.playbackRate = r;
    state.settings.ttsRate = r === 1 ? 0.95 : Math.min(1.3, r * 0.9);
    $('#speedBtn').textContent = r.toFixed(2).replace(/\.?0+$/, '') + '×';
    applySettings();
  };

  $('#loopBtn').onclick = () => {
    if (state.audio.mode === 'none') return toast('本章没有本地音频');
    const l = state.loop;
    if (l.a == null) {
      l.a = audio.currentTime; l.b = null; l.on = false;
      $('#loopBtn').classList.add('on');
      toast('A 点已设置，再点一次设置 B 点');
    } else if (l.b == null) {
      l.b = audio.currentTime;
      if (l.b <= l.a + 0.3) { l.a = null; l.b = null; l.on = false; $('#loopBtn').classList.remove('on'); return toast('B 点需在 A 点之后'); }
      l.on = true;
      toast(`循环 ${fmtTime(l.a)} – ${fmtTime(l.b)}`);
    } else {
      l.a = null; l.b = null; l.on = false;
      $('#loopBtn').classList.remove('on');
      toast('已取消复读');
    }
  };

  $('#sleepBtn').onclick = () => {
    const s = state.sleep;
    const steps = [0, 15, 30, 60];
    const idx = steps.indexOf(s.until);
    const next = steps[(idx + 1) % steps.length];
    clearTimeout(s.timer);
    s.until = next;
    $('#sleepBtn').classList.toggle('on', next > 0);
    $('#sleepBtn').textContent = next ? `${next}m` : '⏱';
    if (next) {
      s.timer = setTimeout(() => {
        audio.pause();
        if (state.tts.on) stopTTS();
        toast('定时结束，已暂停播放');
        s.until = 0; $('#sleepBtn').classList.remove('on'); $('#sleepBtn').textContent = '⏱';
      }, next * 60000);
      toast(`将在 ${next} 分钟后暂停`);
    } else {
      toast('已关闭定时');
    }
  };

  // 进度条拖动
  (() => {
    const track = $('#track');
    let dragging = false;
    const seek = (e) => {
      if (state.audio.mode === 'none' || !audio.duration) return;
      const r = track.getBoundingClientRect();
      const pct = clamp((e.clientX - r.left) / r.width, 0, 1);
      audio.currentTime = pct * audio.duration;
      updateTimes(audio.currentTime, audio.duration);
    };
    track.addEventListener('pointerdown', (e) => {
      if (state.audio.mode === 'none') return;
      dragging = true; track.classList.add('dragging'); track.setPointerCapture(e.pointerId); seek(e);
    });
    track.addEventListener('pointermove', (e) => { if (dragging) seek(e); });
    track.addEventListener('pointerup', (e) => { dragging = false; track.classList.remove('dragging'); });
    track.addEventListener('keydown', (e) => {
      if (state.audio.mode === 'none' || !audio.duration) return;
      if (e.key === 'ArrowRight') { audio.currentTime = clamp(audio.currentTime + 5, 0, audio.duration); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime = clamp(audio.currentTime - 5, 0, audio.duration); e.preventDefault(); }
    });
  })();

  /* ---------------- 本地音频检测 ---------------- */
  let audioScanToken = 0;
  async function refreshAudioList() {
    const ul = $('#audioList');
    if (!ul) return;
    const token = ++audioScanToken;
    ul.innerHTML = '<li class="audio-item" style="color:var(--ink-3)">正在检测本地音频…</li>';
    audioSources.clear();
    const chapters = state.chapters.filter(c => c.index > 0);
    const results = await Promise.all(chapters.map(async ch => ({ ch, url: await loadAudioSource(ch) })));
    if (token !== audioScanToken) return;
    ul.innerHTML = '';
    results.forEach(({ ch, url }) => {
      const li = document.createElement('li');
      li.className = 'audio-item';
      li.innerHTML = url
        ? `<span>${escapeHtml(ch.title)}<span class="ok"> · 已就绪</span>
            <span class="audio-file">${escapeHtml(url)}</span></span>`
        : `<span>${escapeHtml(ch.title)}<span class="audio-file"> · 未找到 audio/ch${ch.index}.mp3</span></span>`;
      ul.appendChild(li);
    });
  }

  $('#audioRescanBtn').onclick = async () => {
    await refreshAudioList();
    if (state.chapter) setupPlayerForChapter(state.chapter);
    toast('已重新检测本地音频');
  };

  /* ---------------- 设置抽屉 ---------------- */
  function openSheet() {
    $('#sheet').classList.add('open');
    $('#sheet').setAttribute('aria-hidden', 'false');
    $('#scrim').hidden = false;
    document.body.classList.add('no-scroll');
    refreshAudioList();
  }
  function closeSheet() {
    $('#sheet').classList.remove('open');
    $('#sheet').setAttribute('aria-hidden', 'true');
    $('#scrim').hidden = true;
    document.body.classList.remove('no-scroll');
  }
  $('#settingsBtn').onclick = openSheet;
  $('#sheetClose').onclick = closeSheet;
  $('#scrim').onclick = closeSheet;

  $('#themeBtn').onclick = () => {
    const order = ['paper', 'sepia', 'dark'];
    state.settings.theme = order[(order.indexOf(state.settings.theme) + 1) % order.length];
    applySettings();
  };

  $$('.theme-swatch').forEach(b => b.onclick = () => {
    state.settings.theme = b.dataset.themeOpt;
    applySettings();
  });
  $$('#modeSeg button, #modeSegSheet button').forEach(b => b.onclick = () => {
    state.settings.mode = b.dataset.mode;
    applySettings();
  });
  $$('#lhSeg button').forEach(b => b.onclick = () => {
    state.settings.lh = parseFloat(b.dataset.lh);
    applySettings();
  });
  const setSize = (v) => { state.settings.size = +v; applySettings(); };
  $('#sizeRange').addEventListener('input', e => setSize(e.target.value));
  $('#sizeRange2').addEventListener('input', e => setSize(e.target.value));
  $('#speedRange').addEventListener('input', e => {
    state.settings.ttsRate = +e.target.value / 100;
    applySettings();
  });
  $('#autoNext').addEventListener('change', e => {
    state.settings.autoNext = e.target.checked;
    applySettings();
  });
  $('#autoSpeak').addEventListener('change', e => {
    state.settings.autoSpeak = e.target.checked;
    applySettings();
  });
  $('#resetProgressBtn').onclick = () => {
    if (!confirm('重置所有章节的阅读进度？')) return;
    state.progress = {};
    saveProgress();
    toast('阅读进度已重置');
    if (state.chapter) renderChapter(state.chapter, { startAt: 0 });
  };
  $('#clearAllBtn').onclick = async () => {
    if (!confirm('将清除阅读进度、生词本和全部本地设置（不会删除 audio/ 里的音频），确定吗？')) return;
    ['bw.settings', 'bw.progress', 'bw.vocab', 'bw.minutes', 'bw.last', 'bw.dict'].forEach(store.del);
    location.reload();
  };

  /* ---------------- 移动端目录 ---------------- */
  function openTocSheet() {
    const nav = $('#tocSheetNav');
    nav.innerHTML = '';
    state.chapters.forEach(c => {
      const pct = chapterPct(c);
      const a = document.createElement('a');
      a.className = 'rail-link' + (c.id === state.chapter?.id ? ' active' : '') + (pct >= 1 ? ' done' : '');
      a.href = `#/read/${c.id}`;
      a.innerHTML = `<span class="n">${c.index === 0 ? '00' : pad2(c.index)}</span>
        <span style="flex:1">${escapeHtml(c.title)}</span>
        <span class="n">${Math.round(pct * 100)}%</span>`;
      a.addEventListener('click', () => setTimeout(closeTocSheet, 30));
      nav.appendChild(a);
    });
    $('#tocSheet').classList.add('open');
    $('#tocSheet').setAttribute('aria-hidden', 'false');
    $('#tocScrim').hidden = false;
    document.body.classList.add('no-scroll');
  }
  function closeTocSheet() {
    $('#tocSheet').classList.remove('open');
    $('#tocSheet').setAttribute('aria-hidden', 'true');
    $('#tocScrim').hidden = true;
    document.body.classList.remove('no-scroll');
  }
  $('#tocClose').onclick = closeTocSheet;
  $('#tocScrim').onclick = closeTocSheet;
  $('#mobileTocBtn')?.addEventListener('click', openTocSheet);

  /* ---------------- 单词发音 & 朗读快捷键 ---------------- */

  /* ---------------- 全局事件 ---------------- */
  document.addEventListener('click', (e) => {
    const enP = e.target.closest('.pair .en');
    if (enP && !e.target.closest('.wordpop')) {
      const hit = wordAtPoint(e.clientX, e.clientY);
      if (hit) {
        e.preventDefault();
        const saved = state.vocab.find(v => v.word.toLowerCase() === hit.word);
        showWordPop({ word: hit.word, display: hit.display, sentence: hit.sentence, x: e.clientX, y: e.clientY, saved });
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if (e.key === 'Escape') {
      if (!$('#review').hidden) return endReview();
      if (state.pendingWord) return hideWordPop();
      if ($('#sheet').classList.contains('open')) return closeSheet();
      return;
    }
    if (typing) return;
    if (e.key === ' ' && state.route.startsWith('/read/')) {
      e.preventDefault();
      $('#plPlay').click();
    } else if (e.key === 'ArrowRight' && state.route.startsWith('/read/') && !e.altKey) {
      // 仅在非拖拽进度条时切章
      if (!e.target.closest('.track')) { e.preventDefault(); goChapter(1); }
    } else if (e.key === 'ArrowLeft' && state.route.startsWith('/read/') && !e.altKey) {
      if (!e.target.closest('.track')) { e.preventDefault(); goChapter(-1); }
    } else if ((e.key === 'j' || e.key === 'J') && state.route.startsWith('/read/')) {
      movePair(1);
    } else if ((e.key === 'k' || e.key === 'K') && state.route.startsWith('/read/')) {
      movePair(-1);
    } else if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey) {
      $('#themeBtn').click();
    }
  });

  function movePair(delta) {
    const target = clamp(state.activePair + delta, 0, (state.chapter?.paragraphs.length || 1) - 1);
    const el = $(`.pair[data-i="${target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      state.activePair = target;
    }
  }

  /* ---------------- 学习时长 ---------------- */
  setInterval(() => {
    if (document.hidden) return;
    if (!state.route.startsWith('/read/')) return;
    state.minutes += 1 / 3;
    store.set('bw.minutes', state.minutes);
  }, 20000);

  /* ---------------- 启动 ---------------- */
  function boot() {
    const data = window.COURSE_DATA;
    if (!data) {
      document.body.innerHTML = `
        <div class="shell-notice">
          <h1>Love or Money?</h1>
          <p>这里是在线的界面外壳。课程正文、译文与音频仅保存在本机，不随公开站点发布。</p>
          <p class="hint">本机使用：把 <code>data/</code> 与 <code>audio/</code> 和页面放在同一目录，用静态服务器打开即可。</p>
        </div>`;
      return;
    }
    state.chapters = data.chapters;
    state.chapters.forEach(c => state.byId.set(c.id, c));

    updateVocabBadges();
    applySettings();

    // 预置朗读音色
    if (ttsSupported) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => {};
    }

    window.addEventListener('hashchange', route);
    route();

    // 离线缓存
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  boot();
})();
