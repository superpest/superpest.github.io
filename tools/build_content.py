import re, json, html, glob, os
from html.parser import HTMLParser

class Node:
    def __init__(self, tag='root', attrs=()):
        self.tag=tag; self.attrs=dict(attrs); self.children=[]
    def text(self):
        return ''.join(c if isinstance(c,str) else c.text() for c in self.children)

class Parser(HTMLParser):
    VOID={'br','img','hr','meta','link','input','source','area','base','col','embed','param','track','wbr'}
    def __init__(self):
        super().__init__(convert_charrefs=True); self.root=Node(); self.cur=self.root; self.stack=[self.root]
    def handle_starttag(self,tag,attrs):
        n=Node(tag,attrs); self.cur.children.append(n)
        if tag not in self.VOID:
            self.stack.append(n); self.cur=n
    def handle_startendtag(self,tag,attrs):
        self.cur.children.append(Node(tag,attrs))
    def handle_endtag(self,tag):
        if tag in self.VOID: return
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:
                del self.stack[i:]; self.cur=self.stack[-1]; return
    def handle_data(self,d):
        self.cur.children.append(d)

def iter_nodes(n):
    for c in n.children:
        if isinstance(c,Node):
            yield c
            yield from iter_nodes(c)

def extract(path):
    raw=open(path,encoding='utf-8',errors='replace').read()
    p=Parser(); p.feed(raw)
    box=next((n for n in iter_nodes(p.root) if n.attrs.get('id')=='contentBox'), None)
    if box is None: return None
    # direct paragraph-level blocks, in document order, but only those inside content
    blocks=[]; audio=None
    def walk(n):
        nonlocal audio
        for c in n.children:
            if not isinstance(c,Node): continue
            if c.tag=='iframe' and c.attrs.get('module')=='insertaudio':
                try: audio=json.loads(c.attrs.get('data','{}'))
                except Exception: audio={}
                continue
            if c.tag in ('p','h1','h2','h3','h4'):
                # skip if it contains nested p/iframe (container)
                kids=[g for g in iter_nodes(c) if g.tag in ('p','iframe')]
                txt=re.sub(r'\s+',' ',c.text()).strip()
                if txt: blocks.append({'tag':c.tag,'text':txt})
                if kids: continue
                continue
            walk(c)
    walk(box)
    return blocks, audio

toc=[('89691760','简介','Introduction'),('89691761','Chapter 1','Chapter 1'),
     ('89691762','Chapter 2','Chapter 2'),('89691763','Chapter 3','Chapter 3'),
     ('89691764','Chapter 4','Chapter 4'),('89691935','Chapter 5','Chapter 5'),
     ('89691984','Chapter 6','Chapter 6'),('89692059','Chapter 7','Chapter 7')]


def norm_en(t):
    # 原文本英文段落混用了全角标点，统一为英文排版
    t = t.replace('，', ', ').replace('．', '. ').replace('！', '! ')
    t = t.replace('？', '? ').replace('：', ': ').replace('；', '; ')
    t = t.replace('（', ' (').replace('）', ') ').replace('、', ', ')
    t = t.replace('“', '"').replace('”', '"').replace('‘', "'").replace('’', "'")
    t = re.sub(r'\s+([,.;:!?])', r'\1', t)   # 标点前不留空格
    t = re.sub(r"([,.;:!?])\s*(['\"”’])", r"\1\2 ", t)  # 引号前不留空格，引号后留空格
    t = re.sub(r'\s{2,}', ' ', t)
    return t.strip()

zh_re=re.compile(r'[一-鿿]')
chapters=[]
for cid,title,en in toc:
    raw=open(f'source_89691708/pages/{cid}.html',encoding='utf-8',errors='replace').read()
    blocks,_=extract(f'source_89691708/pages/{cid}.html')
    _m=re.search(r'<iframe[^>]*module="insertaudio"[^>]*data="([^"]*)"',raw)
    audio=json.loads(html.unescape(_m.group(1))) if _m else None
    paras=[]
    for b in blocks:
        t=b['text']
        if t.startswith('来自：') or t in ('中英对照文本',): continue
        (paras.append({'zh':t}) if zh_re.search(t) else paras.append({'en':t}))
    # pair en+zh sequentially
    paired=[]; i=0
    while i < len(paras):
        cur=paras[i]
        if 'en' in cur:
            nxt=paras[i+1] if i+1<len(paras) else None
            if nxt and 'zh' in nxt:
                paired.append({'en':norm_en(cur['en']),'zh':nxt['zh']}); i+=2; continue
            paired.append({'en':norm_en(cur['en']),'zh':''}); i+=1; continue
        paired.append({'en':'','zh':cur['zh']}); i+=1
    chapters.append({
        'id':cid,'title':title,'titleEn':en,'index':len(chapters),
        'audio': {k:audio.get(k) for k in ('objectid','name','size','hsize','type')} if audio else None,
        'paragraphs':paired,
    })
    print(cid,title,'paras',len(paired),'en',sum(1 for x in paired if x['en']),'zh',sum(1 for x in paired if x['zh']),'audio',bool(audio))

out={'course':{
    'id':'89691708','title':'爱情与金钱','titleEn':'Love or Money?','level':'书虫 · 1 级',
    'series':'Oxford Bookworms Library','publisher':'外语教学与研究出版社 / Oxford University Press',
    'source':'https://zhuanti.chaoxing.com/mobile/mooc/tocourse/89691708',
    'uploader':'萤火虫','language':'en-zh','chapterCount':len(chapters)},'chapters':chapters}
os.makedirs('love-money-study/data',exist_ok=True)
json.dump(out,open('love-money-study/data/course.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('written', os.path.getsize('love-money-study/data/course.json'),'bytes')
with open('love-money-study/data/course.js','w',encoding='utf-8') as f:
    f.write('/* 自动生成：由原课程章节页解析而来。请勿手工编辑。 */\n')
    f.write('window.COURSE_DATA = ')
    json.dump(out,f,ensure_ascii=False,separators=(',',':'))
    f.write(';\n')
