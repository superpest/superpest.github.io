#!/usr/bin/env python3
"""Build the static NCE (books 1-2) study site from the extracted archive.

Usage:
    python3 -I tools/nce_build.py <extracted_public_dir> <site_nce_dir>

The archive is untrusted input: this script only reads text files and copies
audio; it never executes anything from the archive.
"""

import json
import os
import re
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/nce_extract/nce-web-main/public"
DEST = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "nce")

BOOKS = [
    {
        "id": "nce1",
        "dir": "NCE1",
        "no": 1,
        "short": "第一册",
        "title": "新概念英语 第一册",
        "en": "First Things First",
        "zh": "英语初阶",
    },
    {
        "id": "nce2",
        "dir": "NCE2",
        "no": 2,
        "short": "第二册",
        "title": "新概念英语 第二册",
        "en": "Practice and Progress",
        "zh": "实践与进步",
    },
]

TIME_RE = re.compile(r"^\[(\d+):(\d+(?:\.\d+)?)\](.*)$")
INTRO_RE = re.compile(r"^Lesson\s+\d+$", re.I)
INTRO_CN_RE = re.compile(r"^第\s*\d+\s*课$")
LESSON_AUDIO_BITRATE = "64k"
LESSON_AUDIO_RATE = "32000"


def clean_dest():
    data = os.path.join(DEST, "data")
    media = os.path.join(DEST, "media")
    for p in (data, media):
        if os.path.isdir(p):
            shutil.rmtree(p)
    os.makedirs(os.path.join(data, "lessons"), exist_ok=True)
    os.makedirs(os.path.join(data, "words"), exist_ok=True)
    os.makedirs(os.path.join(media, "lessons"), exist_ok=True)
    os.makedirs(os.path.join(media, "words"), exist_ok=True)


def parse_lrc(path):
    with open(path, "r", encoding="utf-8-sig") as f:
        text = f.read()
    title = ""
    m = re.search(r"^\[ti:(.*)\]\s*$", text, re.M)
    if m:
        title = m.group(1).strip()
    lines = []
    for raw in text.splitlines():
        m = TIME_RE.match(raw.strip())
        if not m:
            continue
        sec = int(m.group(1)) * 60 + float(m.group(2))
        body = m.group(3).strip()
        if not body:
            continue
        if "|" in body:
            en, cn = body.split("|", 1)
        else:
            en, cn = body, ""
        en, cn = en.strip(), cn.strip()
        if INTRO_RE.match(en) and INTRO_CN_RE.match(cn or ""):
            continue
        if not en:
            continue
        lines.append({"t": round(sec, 2), "en": en, "cn": cn})
    lines.sort(key=lambda x: x["t"])
    return title, lines


def lesson_sort_key(name):
    m = re.match(r"(\d+)", name)
    return int(m.group(1)) if m else 10**9


def find_lesson_files(book_dir):
    out = []
    for name in os.listdir(book_dir):
        if not name.lower().endswith(".lrc"):
            continue
        stem = name[:-4]
        if "－" in stem:
            prefix, rest = stem.split("－", 1)
        elif "-" in stem:
            prefix, rest = stem.split("-", 1)
        else:
            prefix, rest = "", stem
        m = re.match(r"(\d+)", prefix)
        if not m:
            continue
        numbers = [int(x) for x in re.findall(r"\d+", prefix)]
        out.append(
            {
                "lrc": os.path.join(book_dir, name),
                "stem": stem,
                "numbers": numbers,
                "first": numbers[0],
                "fallback_title": rest.strip(),
            }
        )
    out.sort(key=lambda x: x["first"])
    return out


def load_words(book_id):
    path = os.path.join(SRC, "words", f"{book_id}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    by_num = {}
    for lesson in data.get("lessons", []):
        try:
            n = int(lesson.get("lessonNumber", "0"))
        except ValueError:
            continue
        by_num[n] = lesson
    return data.get("meta", {}), by_num


def build_word_audio(book, word_lessons, dest):
    """Assign short, URL-safe audio names to every unique word in a book."""
    src_dir = os.path.join(SRC, "words", book["id"])
    existing = set()
    if os.path.isdir(src_dir):
        existing = set(os.listdir(src_dir))
    out_dir = os.path.join(dest, "media", "words", book["id"])
    os.makedirs(out_dir, exist_ok=True)

    word_map = {}
    copied = 0
    for lesson in word_lessons.values():
        for w in lesson.get("words", []):
            word = w.get("word", "").strip()
            if not word or word in word_map:
                continue
            entry = {"us": None, "uk": None}
            wid = "w%04d" % (len(word_map) + 1)
            for accent, key in (("a", "us"), ("e", "uk")):
                fname = f"{word}_{accent}.mp3"
                if fname in existing:
                    dst_name = f"{wid}_{accent}.mp3"
                    shutil.copyfile(
                        os.path.join(src_dir, fname),
                        os.path.join(out_dir, dst_name),
                    )
                    entry[key] = f"media/words/{book['id']}/{dst_name}"
                    copied += 1
            word_map[word] = entry
    print(f"  {book['id']}: {len(word_map)} unique words, {copied} word clips")
    return word_map


def transcode(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", src,
            "-ac", "1", "-ar", LESSON_AUDIO_RATE,
            "-codec:a", "libmp3lame", "-b:a", LESSON_AUDIO_BITRATE,
            dst,
        ],
        check=True,
    )
    return dst


def word_entry(w, word_map):
    word = w.get("word", "").strip()
    audio = word_map.get(word, {})
    phon = [p for p in (w.get("phonetic") or []) if p]
    return {
        "word": word,
        "phonetic": phon,
        "pos": (w.get("pos") or "").strip(),
        "meaning": (w.get("meaning") or "").strip(),
        "us": audio.get("us"),
        "uk": audio.get("uk"),
    }


def main():
    if not os.path.isdir(os.path.join(SRC, "NCE1")):
        sys.exit(f"source not found: {SRC}")
    clean_dest()

    books_out = []
    jobs = []

    for book in BOOKS:
        print(f"Building {book['id']} ...")
        book_dir = os.path.join(SRC, book["dir"])
        files = find_lesson_files(book_dir)
        meta, word_lessons = load_words(book["id"])
        word_map = build_word_audio(book, word_lessons, DEST)

        lessons_meta = []
        word_total = 0
        for i, item in enumerate(files, 1):
            title_en, lines = parse_lrc(item["lrc"])
            title_en = title_en or item["fallback_title"]
            # merge the word list of paired lessons (NCE1 1&2, 3&4, ...)
            merged = []
            seen = set()
            title_cn = ""
            for n in item["numbers"]:
                wl = word_lessons.get(n)
                if not wl:
                    continue
                if not title_cn and wl.get("titleCn"):
                    title_cn = wl["titleCn"].strip()
                for w in wl.get("words", []):
                    word = (w.get("word") or "").strip()
                    if not word or word.lower() in seen:
                        continue
                    seen.add(word.lower())
                    merged.append(word_entry(w, word_map))
            word_total += len(merged)

            if len(item["numbers"]) > 1:
                label = f"Lesson {item['numbers'][0]}–{item['numbers'][-1]}"
            else:
                label = f"Lesson {item['numbers'][0]}"
            slug = f"{book['id']}-{item['first']:03d}"
            audio_rel = f"media/lessons/{book['id']}/{item['first']:03d}.mp3"
            data = {
                "id": slug,
                "book": book["id"],
                "numbers": item["numbers"],
                "label": label,
                "titleEn": title_en,
                "titleCn": title_cn,
                "audio": audio_rel,
                "lines": lines,
                "words": merged,
            }
            with open(os.path.join(DEST, "data", "lessons", f"{slug}.json"), "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
            jobs.append(
                (
                    item["lrc"][:-4] + ".mp3",
                    os.path.join(DEST, audio_rel),
                )
            )
            lessons_meta.append(
                {
                    "id": slug,
                    "label": label,
                    "numbers": item["numbers"],
                    "titleEn": title_en,
                    "titleCn": title_cn,
                    "wordCount": len(merged),
                }
            )

        # words page data
        words_doc = {
            "book": book["id"],
            "lessons": [
                {
                    "id": lm["id"],
                    "label": lm["label"],
                    "titleEn": lm["titleEn"],
                    "titleCn": lm["titleCn"],
                }
                for lm in lessons_meta
            ],
        }
        # attach the same per-lesson word lists
        for lm, doc_lesson in zip(lessons_meta, words_doc["lessons"]):
            with open(os.path.join(DEST, "data", "lessons", f"{lm['id']}.json"), encoding="utf-8") as f:
                doc_lesson["words"] = json.load(f)["words"]
        with open(os.path.join(DEST, "data", "words", f"{book['id']}.json"), "w", encoding="utf-8") as f:
            json.dump(words_doc, f, ensure_ascii=False, separators=(",", ":"))

        books_out.append(
            {
                "id": book["id"],
                "no": book["no"],
                "short": book["short"],
                "title": book["title"],
                "en": book["en"],
                "zh": book["zh"],
                "lessonCount": len(lessons_meta),
                "wordCount": word_total,
                "lessons": lessons_meta,
            }
        )

    with open(os.path.join(DEST, "data", "books.json"), "w", encoding="utf-8") as f:
        json.dump({"books": books_out}, f, ensure_ascii=False, separators=(",", ":"))
    print("Writing books.json")
    for b in books_out:
        print(f"  {b['id']}: {b['lessonCount']} lessons, {b['wordCount']} word entries")

    # Transcode lesson audio in parallel
    print(f"Transcoding {len(jobs)} lesson audio files ...")
    done = 0

    def run(job):
        nonlocal done
        src, dst = job
        transcode(src, dst)
        done += 1
        if done % 20 == 0 or done == len(jobs):
            print(f"  {done}/{len(jobs)}")

    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(run, jobs))

    size = 0
    for root, _, names in os.walk(os.path.join(DEST, "media", "lessons")):
        for n in names:
            size += os.path.getsize(os.path.join(root, n))
    print(f"Lesson audio: {size / 1048576:.1f} MB")
    print("Done.")


if __name__ == "__main__":
    main()
