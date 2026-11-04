import json, os, sys, time, urllib.request

BASE = 'https://zhuanti.chaoxing.com'
APP = '/disk2/love/love-money-study'
UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'
HDRS = {'User-Agent': UA, 'Referer': BASE + '/'}


def get(url, timeout=30):
    req = urllib.request.Request(url, headers=HDRS)
    return urllib.request.urlopen(req, timeout=timeout).read()


def main():
    data = json.load(open(os.path.join(APP, 'data/course.json'), encoding='utf-8'))
    outdir = os.path.join(APP, 'audio')
    os.makedirs(outdir, exist_ok=True)
    ok = 0
    for ch in data['chapters']:
        meta = ch.get('audio')
        if not meta:
            continue
        oid = meta['objectid']
        info = json.loads(get(f'{BASE}/special/files/{oid}/fileDetail?key=httphd'))
        if info.get('result') != 1:
            print(f"FAIL  {ch['title']}: {info}")
            continue
        m = info['msg']
        url = m.get('http') or m.get('httpmd') or m.get('download')
        if not url:
            print(f"FAIL  {ch['title']}: no play url")
            continue
        dest = os.path.join(outdir, f"ch{ch['index']}.mp3")
        last_err = None
        for attempt in range(3):
            try:
                blob = get(url, timeout=120)
                break
            except Exception as e:  # noqa: BLE001
                last_err = e
                time.sleep(1.5)
        else:
            print(f"FAIL  {ch['title']}: download {last_err}")
            continue
        with open(dest, 'wb') as f:
            f.write(blob)
        dur = m.get('duration')
        print(f"OK    ch{ch['index']}  {len(blob):>9,} B  {dur}s  {m.get('filename')}")
        ok += 1
    print(f'下载完成：{ok} 个文件 -> {outdir}')


if __name__ == '__main__':
    main()
