(function () {
  'use strict';

  const tabsEl = document.getElementById('bookTabs');
  const groupsEl = document.getElementById('wordGroups');
  const totalEl = document.getElementById('wordTotal');
  const emptyEl = document.getElementById('emptyState');
  const searchEl = document.getElementById('searchInput');
  const accentEl = document.getElementById('accentSwitch');

  const state = {
    books: [],
    bookId: 'nce1',
    query: '',
    accent: NCE.get('nceAccent', 'us') === 'uk' ? 'uk' : 'us',
    data: null,
    cache: new Map(),
  };

  function currentBook() {
    return state.books.find((b) => b.id === state.bookId) || state.books[0];
  }

  function renderTabs() {
    tabsEl.innerHTML = state.books.map((book) => {
      const on = book.id === state.bookId;
      return `
        <button class="book-tab${on ? ' is-on' : ''}" type="button" data-id="${book.id}" aria-pressed="${on}">
          <span class="bt-no">${NCE.roman(book.no)}</span>
          <span class="bt-body">
            <span class="bt-kicker">${NCE.esc(book.en)} · ${NCE.esc(book.zh)}</span>
            <span class="bt-title">${NCE.esc(book.short)}</span>
            <span class="bt-meta">${book.lessonCount} 课 · ${NCE.fmtNum(book.wordCount)} 个词条</span>
          </span>
          <span class="bt-flag"><i class="dot"></i>本册</span>
        </button>`;
    }).join('');

    tabsEl.querySelectorAll('.book-tab').forEach((tab) => {
      tab.addEventListener('click', () => selectBook(tab.dataset.id));
    });
  }

  function renderAccent() {
    accentEl.querySelectorAll('button').forEach((b) => {
      const on = b.dataset.accent === state.accent;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function phon(w) {
    if (!w.phonetic || !w.phonetic.length) return '';
    return `<span class="wr-phon">[${NCE.esc(w.phonetic.join(', '))}]</span>`;
  }

  function rowHtml(w) {
    const primary = state.accent === 'uk' ? w.uk : w.us;
    const fallback = state.accent === 'uk' ? w.us : w.uk;
    const src = primary || fallback || '';
    const fb = primary && fallback ? fallback : '';
    return `
      <li>
        <button class="word-row" type="button" data-src="${NCE.esc(src)}" data-fallback="${NCE.esc(fb)}"${src ? '' : ' aria-disabled="true"'}>
          <span class="wr-main">
            <span class="wr-top">
              <span class="wr-word">${NCE.esc(w.word)}</span>
              ${phon(w)}
            </span>
            <span class="wr-def">${w.pos ? `<span class="w-pos">${NCE.esc(w.pos)}</span>` : ''}${NCE.esc(w.meaning)}</span>
          </span>
          <span class="wr-play">${NCE.speakerIcon}</span>
        </button>
      </li>`;
  }

  function renderGroups() {
    if (!state.data) return;
    const query = state.query.trim().toLowerCase();
    let matched = 0;
    let total = 0;
    const html = [];

    for (const lesson of state.data.lessons) {
      const words = (lesson.words || []).filter((w) => {
        total += 1;
        if (!query) return true;
        return `${w.word} ${w.meaning} ${w.pos}`.toLowerCase().includes(query);
      });
      if (!words.length) continue;
      matched += words.length;
      html.push(`
        <section class="word-group">
          <div class="wg-head">
            <span class="wg-label">${NCE.esc(lesson.label)}</span>
            <h3 class="wg-title">${NCE.esc(lesson.titleEn)}</h3>
            <span class="wg-zh">${NCE.esc(lesson.titleCn)}</span>
            <span class="wg-count">${words.length} 词</span>
          </div>
          <ul class="wg-body">${words.map(rowHtml).join('')}</ul>
        </section>`);
    }

    groupsEl.innerHTML = html.join('');
    emptyEl.hidden = matched !== 0;
    totalEl.textContent = query
      ? `${matched} / ${total} 个词条`
      : `${NCE.fmtNum(total)} 个词条`;
  }

  async function loadBook(id) {
    if (state.cache.has(id)) {
      state.data = state.cache.get(id);
      renderGroups();
      return;
    }
    groupsEl.innerHTML = '<p class="loading">正在整理单词…</p>';
    totalEl.textContent = '正在整理…';
    try {
      const data = await NCE.json(`data/words/${id}.json`);
      state.cache.set(id, data);
      if (state.bookId !== id) return;
      state.data = data;
      renderGroups();
    } catch (e) {
      console.error(e);
      groupsEl.innerHTML = '<p class="empty">单词内容加载失败，请刷新页面重试。</p>';
      totalEl.textContent = '—';
    }
  }

  function selectBook(id) {
    if (!state.books.some((b) => b.id === id) || id === state.bookId) return;
    state.bookId = id;
    state.query = '';
    searchEl.value = '';
    NCE.set('nceBook', id);
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// */ }
    renderTabs();
    loadBook(id);
  }

  function bind() {
    searchEl.addEventListener('input', () => {
      state.query = searchEl.value;
      renderGroups();
    });
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchEl.value = '';
        state.query = '';
        renderGroups();
        searchEl.blur();
      }
    });

    accentEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-accent]');
      if (!btn) return;
      state.accent = btn.dataset.accent;
      NCE.set('nceAccent', state.accent);
      renderAccent();
      renderGroups();
    });

    groupsEl.addEventListener('click', (e) => {
      const row = e.target.closest('.word-row');
      if (!row || !row.dataset.src) return;
      NCE.playClip(row.dataset.src, row.dataset.fallback).then((ok) => {
        if (ok) NCE.markSpeaking(row);
      });
    });
  }

  async function init() {
    bind();
    renderAccent();
    try {
      const books = await NCE.json('data/books.json');
      state.books = books.books || [];
      if (!state.books.length) throw new Error('empty');

      const fromHash = location.hash.replace(/^#/, '');
      const saved = NCE.get('nceBook', '');
      const lastBook = NCE.lastBook();
      state.bookId = [fromHash, saved, lastBook, 'nce1'].find(
        (id) => id && state.books.some((b) => b.id === id)
      ) || state.books[0].id;

      renderTabs();
      await loadBook(state.bookId);
    } catch (e) {
      console.error(e);
      groupsEl.innerHTML = '<p class="empty">单词内容加载失败，请刷新页面重试。</p>';
      totalEl.textContent = '—';
    }
  }

  init();
})();
