(function () {
  'use strict';

  const tabsEl = document.getElementById('bookTabs');
  const listEl = document.getElementById('lessonList');
  const countEl = document.getElementById('lessonCount');
  const emptyEl = document.getElementById('emptyState');
  const searchEl = document.getElementById('searchInput');
  const continueEl = document.getElementById('continueLink');

  const state = {
    books: [],
    bookId: 'nce1',
    query: '',
  };

  function currentBook() {
    return state.books.find((b) => b.id === state.bookId) || state.books[0];
  }

  function findLesson(id) {
    for (const book of state.books) {
      const lesson = book.lessons.find((l) => l.id === id);
      if (lesson) return { book, lesson };
    }
    return null;
  }

  function shortLabel(lesson) {
    if (!lesson.numbers || !lesson.numbers.length) return '';
    if (lesson.numbers.length > 1) {
      return `L${lesson.numbers[0]}–${lesson.numbers[lesson.numbers.length - 1]}`;
    }
    return `L${lesson.numbers[0]}`;
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
          <span class="bt-flag"><i class="dot"></i>在读</span>
        </button>`;
    }).join('');

    tabsEl.querySelectorAll('.book-tab').forEach((tab) => {
      tab.addEventListener('click', () => selectBook(tab.dataset.id));
    });
  }

  function selectBook(id) {
    if (!state.books.some((b) => b.id === id) || id === state.bookId) return;
    state.bookId = id;
    state.query = '';
    searchEl.value = '';
    NCE.set('nceBook', id);
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// */ }
    renderTabs();
    renderLessons(true);
  }

  function matches(lesson, query) {
    if (!query) return true;
    const hay = [
      lesson.id,
      lesson.label,
      lesson.titleEn,
      lesson.titleCn,
      String(lesson.numbers[0]),
    ].join(' ').toLowerCase();
    return hay.includes(query);
  }

  function renderLessons(animate) {
    const book = currentBook();
    if (!book) return;
    const query = state.query.trim().toLowerCase();
    const lessons = book.lessons.filter((l) => matches(l, query));
    const last = NCE.readLast();

    emptyEl.hidden = lessons.length !== 0;
    countEl.textContent = query
      ? `${lessons.length} 条结果`
      : `${book.lessonCount} 课 · ${NCE.fmtNum(book.wordCount)} 个词条`;

    listEl.innerHTML = lessons.map((lesson, i) => {
      const lastCls = last && last.id === lesson.id ? ' is-last' : '';
      return `
        <a class="lesson-row${lastCls}" href="lesson.html?id=${encodeURIComponent(lesson.id)}"${animate ? ` style="--i:${Math.min(i, 12)}"` : ''}>
          <span class="lr-num"><b>${String(i + 1).padStart(2, '0')}</b><span>${shortLabel(lesson)}</span></span>
          <span class="lr-body">
            <span class="lr-en">${NCE.esc(lesson.titleEn)}</span>
            <span class="lr-zh">${NCE.esc(lesson.titleCn)}</span>
          </span>
          <span class="lr-words">${lesson.wordCount} 词</span>
          <span class="lr-arrow">${NCE.arrowIcon}</span>
        </a>`;
    }).join('');
  }

  function renderStats() {
    const lessons = state.books.reduce((n, b) => n + b.lessonCount, 0);
    const words = state.books.reduce((n, b) => n + b.wordCount, 0);
    document.getElementById('statBooks').textContent = state.books.length;
    document.getElementById('statLessons').textContent = NCE.fmtNum(lessons);
    document.getElementById('statWords').textContent = NCE.fmtNum(words);
  }

  function renderContinue() {
    const last = NCE.readLast();
    if (!last) return;
    const found = findLesson(last.id);
    if (!found) return;
    continueEl.href = `lesson.html?id=${encodeURIComponent(found.lesson.id)}`;
    document.getElementById('continueTitle').textContent = found.lesson.titleEn;
    document.getElementById('continueMeta').textContent =
      `${found.book.short} · ${found.lesson.label}`;
    continueEl.hidden = false;
  }

  function bindSearch() {
    searchEl.addEventListener('input', () => {
      state.query = searchEl.value;
      renderLessons(false);
    });
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchEl.value = '';
        state.query = '';
        renderLessons(false);
        searchEl.blur();
      }
    });
  }

  function showError(message) {
    listEl.innerHTML = `<p class="empty">${NCE.esc(message)}</p>`;
    countEl.textContent = '—';
  }

  async function init() {
    bindSearch();
    try {
      const data = await NCE.json('data/books.json');
      state.books = data.books || [];
      if (!state.books.length) throw new Error('empty');

      const fromHash = location.hash.replace(/^#/, '');
      const saved = NCE.get('nceBook', '');
      const lastBook = NCE.lastBook();
      state.bookId = [fromHash, saved, lastBook, 'nce1'].find(
        (id) => id && state.books.some((b) => b.id === id)
      ) || state.books[0].id;

      renderStats();
      renderTabs();
      renderLessons(true);
      renderContinue();
    } catch (e) {
      console.error(e);
      showError('课程内容加载失败，请刷新页面重试。');
    }
  }

  init();
})();
