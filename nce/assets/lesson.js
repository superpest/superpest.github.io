(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const lessonId = params.get('id') || '';

  const audio = $('audio');
  const player = $('player');
  const playBtn = $('playBtn');
  const seek = $('seek');
  const curTime = $('curTime');
  const durTime = $('durTime');
  const speedBtn = $('speedBtn');
  const loopBtn = $('loopBtn');
  const followBtn = $('followBtn');
  const transcript = $('transcript');
  const wordList = $('wordList');
  const wordCount = $('wordCount');
  const accentEl = $('accentSwitch');
  const resumeBtn = $('resumeBtn');

  const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
  const savedMode = NCE.get('nceMode', 'both');
  const savedSpeed = parseFloat(NCE.get('nceSpeed', '1'));

  const state = {
    index: -1,
    loop: false,
    loopIndex: null,
    follow: NCE.get('nceFollow', '1') !== '0',
    mode: ['en', 'both', 'cn'].includes(savedMode) ? savedMode : 'both',
    speed: SPEEDS.includes(savedSpeed) ? savedSpeed : 1,
    accent: NCE.get('nceAccent', 'us') === 'uk' ? 'uk' : 'us',
    seeking: false,
    userScrollUntil: 0,
    lastSave: 0,
  };

  let lesson = null;
  let book = null;
  let lines = [];

  /* ---------- data ---------- */

  function activeAt(time) {
    let lo = 0;
    let hi = lines.length - 1;
    let ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lines[mid].t <= time) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }

  function metaOf(books, id) {
    for (const b of books) {
      const found = b.lessons.find((l) => l.id === id);
      if (found) return { book: b, meta: found };
    }
    return null;
  }

  function fillHead() {
    document.title = `${lesson.label}: ${lesson.titleEn} · 新概念英语`;
    $('lessonLabel').textContent = lesson.label;
    $('lessonBook').textContent = book ? book.short : '新概念英语';
    $('lessonTitle').textContent = lesson.titleEn;
    $('lessonZh').textContent = lesson.titleCn || '';
    $('metaLines').textContent = `${lines.length} 句`;
    const mw = $('metaWords');
    mw.textContent = `${lesson.words.length} 个单词`;
    $('metaDuration').textContent = '原声点读';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', `${lesson.label} ${lesson.titleEn}（${lesson.titleCn || ''}）中英对照与逐句点读。`);
  }

  function renderTranscript() {
    if (!lines.length) {
      transcript.innerHTML = '<p class="empty">这一课暂时没有课文内容。</p>';
      return;
    }
    transcript.className = `transcript mode-${state.mode}`;
    transcript.innerHTML = lines.map((line, i) => `
      <button class="line" type="button" data-i="${i}" aria-label="从这一句播放：${NCE.esc(line.en)}">
        <span class="line-time">${NCE.fmtTime(line.t)}</span>
        <span class="line-text">
          <span class="line-en">${NCE.esc(line.en)}</span>
          ${line.cn ? `<span class="line-cn">${NCE.esc(line.cn)}</span>` : ''}
        </span>
        <span class="line-play" aria-hidden="true">${NCE.playIcon}</span>
      </button>`).join('');

    transcript.addEventListener('click', (e) => {
      const btn = e.target.closest('.line');
      if (!btn) return;
      seekTo(Number(btn.dataset.i), true);
    });
  }

  function renderWords() {
    wordCount.textContent = `${lesson.words.length} 词`;
    if (!lesson.words.length) {
      wordList.innerHTML = '<li class="word-empty">本课没有收录单词。</li>';
      return;
    }
    wordList.innerHTML = lesson.words.map((w) => {
      const phon = w.phonetic && w.phonetic.length ? w.phonetic.join(', ') : '';
      return `
        <li>
          <button class="word-item" type="button" data-us="${NCE.esc(w.us || '')}" data-uk="${NCE.esc(w.uk || '')}">
            <span class="w-main">
              <span class="w-word">${NCE.esc(w.word)}</span>
              ${phon ? `<span class="w-phon">[${NCE.esc(phon)}]</span>` : ''}
            </span>
            <span class="w-def">${w.pos ? `<span class="w-pos">${NCE.esc(w.pos)}</span>` : ''}${NCE.esc(w.meaning)}</span>
            <span class="w-play" aria-hidden="true">${NCE.speakerIcon}</span>
          </button>
        </li>`;
    }).join('');
  }

  function renderPager(books) {
    const list = book.lessons;
    const at = list.findIndex((l) => l.id === lesson.id);
    const prev = at > 0 ? list[at - 1] : null;
    const next = at >= 0 && at < list.length - 1 ? list[at + 1] : null;

    const setTopLink = (el, item) => {
      if (item) {
        el.href = `lesson.html?id=${encodeURIComponent(item.id)}`;
        el.removeAttribute('aria-disabled');
      } else {
        el.removeAttribute('href');
        el.setAttribute('aria-disabled', 'true');
      }
    };
    setTopLink($('prevTop'), prev);
    setTopLink($('nextTop'), next);

    const card = (item, dir) => {
      if (!item) {
        return `<div class="pager-card ${dir} dim">
          <span class="pager-kicker">${dir === 'next' ? '下一课' : '上一课'}</span>
          <span class="pager-title">已经到${dir === 'next' ? '最后' : '最前'}一课</span>
        </div>`;
      }
      return `<a class="pager-card ${dir}" href="lesson.html?id=${encodeURIComponent(item.id)}">
        <span class="pager-kicker">${dir === 'next' ? '下一课' : '上一课'}</span>
        <span class="pager-label">${NCE.esc(item.label)}</span>
        <span class="pager-title">${NCE.esc(item.titleEn)}</span>
      </a>`;
    };

    $('lessonPager').innerHTML = card(prev, 'prev') + card(next, 'next');
  }

  /* ---------- player ---------- */

  function setActive(index, force) {
    if (index === state.index && !force) return;
    state.index = index;
    const old = transcript.querySelector('.line.is-on');
    if (old) old.classList.remove('is-on');
    if (index < 0) return;
    const el = transcript.querySelector(`.line[data-i="${index}"]`);
    if (!el) return;
    el.classList.add('is-on');
    if (state.follow) scrollActive();
  }

  function scrollActive() {
    if (Date.now() < state.userScrollUntil) return;
    const el = transcript.querySelector('.line.is-on');
    if (!el) return;
    el.scrollIntoView({
      block: 'center',
      behavior: NCE.reduceMotion() ? 'auto' : 'smooth',
    });
  }

  function updateProgress() {
    if (state.seeking) return;
    const duration = audio.duration || 0;
    const t = audio.currentTime || 0;
    const pct = duration ? Math.min(100, (t / duration) * 100) : 0;
    seek.value = String(t);
    seek.style.setProperty('--p', pct.toFixed(2) + '%');
    curTime.textContent = NCE.fmtTime(t);
  }

  function seekTo(index, play) {
    const line = lines[index];
    if (!line) return;
    if (state.loop) state.loopIndex = index;
    audio.currentTime = Math.max(0, line.t);
    setActive(index, true);
    updateProgress();
    if (play) {
      audio.play().catch(() => { /* iOS may require another gesture */ });
    }
  }

  function step(delta) {
    if (!lines.length) return;
    const current = state.loop && state.loopIndex != null
      ? state.loopIndex
      : activeAt((audio.currentTime || 0) + 0.08);
    let target;
    if (delta < 0) {
      const start = lines[current] ? lines[current].t : 0;
      const into = (audio.currentTime || 0) - start;
      target = current > 0 && into > 1.2 ? current : current - 1;
    } else {
      target = current + 1;
    }
    target = Math.max(0, Math.min(lines.length - 1, target));
    seekTo(target, true);
  }

  function togglePlay() {
    if (audio.paused) {
      if (audio.ended) audio.currentTime = lines.length ? lines[0].t : 0;
      audio.play().catch((err) => console.warn('play failed', err));
    } else {
      audio.pause();
    }
  }

  function setLoop(on) {
    state.loop = on;
    loopBtn.setAttribute('aria-pressed', String(on));
    state.loopIndex = on ? activeAt((audio.currentTime || 0) + 0.08) : null;
  }

  function setFollow(on) {
    state.follow = on;
    followBtn.setAttribute('aria-pressed', String(on));
    NCE.set('nceFollow', on ? '1' : '0');
    if (on) scrollActive();
  }

  function setMode(mode) {
    state.mode = mode;
    NCE.set('nceMode', mode);
    transcript.className = `transcript mode-${mode}`;
    document.querySelectorAll('.mode-switch button').forEach((b) => {
      b.classList.toggle('is-on', b.dataset.mode === mode);
    });
    if (state.follow) scrollActive();
  }

  function speedLabel(v) {
    return (Number.isInteger(v) ? v.toFixed(1) : String(v)) + '×';
  }

  function setSpeed(v) {
    state.speed = v;
    audio.playbackRate = v;
    speedBtn.textContent = speedLabel(v);
    NCE.set('nceSpeed', String(v));
  }

  function cycleSpeed() {
    const i = SPEEDS.indexOf(state.speed);
    setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  }

  function setAccent(accent) {
    state.accent = accent;
    NCE.set('nceAccent', accent);
    accentEl.querySelectorAll('button').forEach((b) => {
      const on = b.dataset.accent === accent;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function savePosition(force) {
    if (!lesson || !Number.isFinite(audio.duration)) return;
    const now = Date.now();
    if (!force && now - state.lastSave < 4000) return;
    state.lastSave = now;
    NCE.set('ncePos:' + lesson.id, (audio.currentTime || 0).toFixed(1));
  }

  function maybeResume() {
    if (!lesson) return;
    const saved = parseFloat(NCE.get('ncePos:' + lesson.id, '0'));
    if (saved > 6 && saved < (audio.duration || 0) - 6) {
      resumeBtn.hidden = false;
      resumeBtn.textContent = `上次听到 ${NCE.fmtTime(saved)}，从这里继续`;
      resumeBtn.addEventListener('click', () => {
        audio.currentTime = saved;
        resumeBtn.hidden = true;
        audio.play().catch(() => {});
      }, { once: true });
    }
  }

  function onTime() {
    if (!lines.length) return;
    if (state.loop && state.loopIndex != null) {
      const i = state.loopIndex;
      const start = lines[i].t;
      const end = i + 1 < lines.length ? lines[i + 1].t : (audio.duration || Infinity);
      if (audio.currentTime >= end - 0.02 || audio.currentTime < start - 0.6) {
        audio.currentTime = start + 0.01;
      }
      setActive(i);
    } else {
      setActive(activeAt((audio.currentTime || 0) + 0.05));
    }
    updateProgress();
    savePosition(false);
  }

  function bindPlayer() {
    audio.src = lesson.audio;
    audio.playbackRate = state.speed;
    speedBtn.textContent = speedLabel(state.speed);
    setLoop(false);
    setFollow(state.follow);
    setMode(state.mode);
    setAccent(state.accent);

    audio.addEventListener('loadedmetadata', () => {
      seek.max = String(audio.duration || 0);
      durTime.textContent = NCE.fmtTime(audio.duration);
      $('metaDuration').textContent = `${NCE.fmtTime(audio.duration)} 原声`;
      updateProgress();
      maybeResume();
    });
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', () => {
      NCE.stopClip();
      player.classList.add('is-playing');
      playBtn.setAttribute('aria-label', '暂停');
    });
    audio.addEventListener('pause', () => {
      player.classList.remove('is-playing');
      playBtn.setAttribute('aria-label', '播放');
      savePosition(true);
    });
    audio.addEventListener('ended', () => {
      if (state.loop && state.loopIndex != null) {
        audio.currentTime = lines[state.loopIndex].t;
        audio.play().catch(() => {});
      }
    });
    audio.addEventListener('error', () => {
      $('metaDuration').textContent = '音频加载失败';
      console.warn('audio error', lesson.audio);
    });

    playBtn.addEventListener('click', togglePlay);
    $('prevLine').addEventListener('click', () => step(-1));
    $('nextLine').addEventListener('click', () => step(1));
    loopBtn.addEventListener('click', () => setLoop(!state.loop));
    followBtn.addEventListener('click', () => setFollow(!state.follow));
    speedBtn.addEventListener('click', cycleSpeed);

    document.querySelectorAll('.mode-switch button').forEach((b) => {
      b.addEventListener('click', () => setMode(b.dataset.mode));
    });

    seek.addEventListener('input', () => {
      state.seeking = true;
      const t = Number(seek.value);
      audio.currentTime = t;
      const pct = audio.duration ? (t / audio.duration) * 100 : 0;
      seek.style.setProperty('--p', pct.toFixed(2) + '%');
      curTime.textContent = NCE.fmtTime(t);
    });
    const endSeek = () => {
      state.seeking = false;
      updateProgress();
      if (state.loop) state.loopIndex = activeAt(audio.currentTime + 0.08);
    };
    seek.addEventListener('change', endSeek);
    seek.addEventListener('pointerup', endSeek);

    wordList.addEventListener('click', (e) => {
      const item = e.target.closest('.word-item');
      if (!item) return;
      const primary = state.accent === 'uk' ? item.dataset.uk : item.dataset.us;
      const fallback = state.accent === 'uk' ? item.dataset.us : item.dataset.uk;
      if (!primary && !fallback) return;
      if (!audio.paused) audio.pause();
      NCE.playClip(primary, fallback).then((ok) => {
        if (ok) NCE.markSpeaking(item);
      });
    });

    accentEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-accent]');
      if (btn) setAccent(btn.dataset.accent);
    });

    window.addEventListener('pagehide', () => savePosition(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') savePosition(true);
    });

    ['wheel', 'touchmove'].forEach((ev) => {
      window.addEventListener(ev, () => {
        state.userScrollUntil = Date.now() + 5000;
      }, { passive: true });
    });

    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t && (t.matches('input, textarea, select') || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          step(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          step(1);
          break;
        case 'l':
        case 'L':
          setLoop(!state.loop);
          break;
        case 'f':
        case 'F':
          setFollow(!state.follow);
          break;
        case 'm':
        case 'M':
          setMode(state.mode === 'both' ? 'en' : state.mode === 'en' ? 'cn' : 'both');
          break;
        default:
          break;
      }
    });
  }

  /* ---------- boot ---------- */

  function fail(message) {
    document.title = '没有找到这一课 · 新概念英语';
    $('lessonTitle').textContent = '没有找到这一课';
    $('lessonZh').textContent = '';
    transcript.innerHTML = `<p class="empty">${NCE.esc(message)} <a href="index.html" style="color:var(--accent)">返回目录</a></p>`;
    player.hidden = true;
    $('wordPanel').hidden = true;
    $('lessonPager').innerHTML = '';
  }

  async function init() {
    if (!lessonId) {
      fail('没有指定课文，请从目录进入。');
      return;
    }
    try {
      const [booksData, data] = await Promise.all([
        NCE.json('data/books.json'),
        NCE.json(`data/lessons/${encodeURIComponent(lessonId)}.json`),
      ]);
      lesson = data;
      lines = lesson.lines || [];
      const found = metaOf(booksData.books || [], lessonId);
      if (!found) throw new Error('lesson metadata missing');
      book = found.book;

      NCE.saveLast(lesson.id);
      NCE.set('nceBook', book.id);

      fillHead();
      renderTranscript();
      renderWords();
      renderPager(booksData.books || []);
      bindPlayer();
    } catch (e) {
      console.error(e);
      fail('这一课的内容加载失败，可能链接有误，请返回目录重试。');
    }
  }

  init();
})();
