"""Turn content/exams/NN.txt into src/data/exams/exam-NN.json plus an index.

File format (one item per line, fields split by |, "//" = line break):
  @title|Theme of the exam
  CO|n|script|question|A|B|C|D|answer-letter      listening, n = 1..39
  CE|n|text|question|A|B|C|D|answer-letter        reading, n = 1..39
  EE|n|prompt|model answer                        writing tasks 1..3
  EO|n|prompt|model answer                        speaking tasks 1..3

Options are shuffled at build time (fixed seed), so the answer letter in the source can be anything.

Run: python3 scripts/build-exams.py
"""
import json, pathlib, random, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'content/exams', ROOT / 'src/data/exams'
# Question difficulty and weight bands (how TCF Canada scores add up to 699)
BANDS = [(4, 'A1', 3), (10, 'A2', 9), (19, 'B1', 15), (29, 'B2', 21), (35, 'C1', 26), (39, 'C2', 33)]


def band(n):
    for last, lvl, pts in BANDS:
        if n <= last:
            return lvl, pts


def nl(s):
    return s.strip().replace('//', '\n')


OUT.mkdir(parents=True, exist_ok=True)
index, bad = [], 0
for f in sorted(SRC.glob('*.txt')):
    ex = {'id': int(f.stem), 'title': '', 'co': [], 'ce': [], 'ee': [], 'eo': []}
    for ln, line in enumerate(f.read_text().splitlines(), 1):
        if not line.strip() or line.startswith('#'):
            continue
        p = line.split('|')
        kind = p[0].strip()
        if kind == '@title':
            ex['title'] = p[1].strip()
        elif kind in ('CO', 'CE'):
            if len(p) != 9 or p[8].strip() not in ('A', 'B', 'C', 'D'):
                print(f'{f.name}:{ln} bad {kind} line ({len(p)} fields)')
                bad += 1
                continue
            n = int(p[1])
            lvl, pts = band(n)
            opts = [nl(x) for x in p[4:8]]
            right = opts['ABCD'.index(p[8].strip())]
            # Shuffle options with a fixed seed so answer letters are spread evenly but stable between builds
            random.Random(f'{ex["id"]}-{kind}-{n}').shuffle(opts)
            ex[kind.lower()].append({'n': n, 'level': lvl, 'pts': pts, 'text': nl(p[2]), 'q': nl(p[3]),
                                     'options': opts, 'answer': opts.index(right)})
        elif kind in ('EE', 'EO'):
            if len(p) != 4:
                print(f'{f.name}:{ln} bad {kind} line ({len(p)} fields)')
                bad += 1
                continue
            ex[kind.lower()].append({'n': int(p[1]), 'prompt': nl(p[2]), 'model': nl(p[3])})
    for k, want in (('co', 39), ('ce', 39), ('ee', 3), ('eo', 3)):
        ex[k].sort(key=lambda x: x['n'])
        got = [x['n'] for x in ex[k]]
        if got != list(range(1, want + 1)):
            print(f'{f.name}: {k} has {len(got)} items, expected 1..{want}')
            bad += 1
    letters = [x['answer'] for x in ex['co'] + ex['ce']]
    dist = [letters.count(i) for i in range(4)]
    (OUT / f'exam-{ex["id"]:02d}.json').write_text(json.dumps(ex, ensure_ascii=False, separators=(',', ':')))
    index.append({'id': ex['id'], 'title': ex['title']})
    print(f'{f.name}: {ex["title"]} · CO {len(ex["co"])} CE {len(ex["ce"])} EE {len(ex["ee"])} EO {len(ex["eo"])} · answers A-D {dist}')
(OUT / 'index.json').write_text(json.dumps(index, ensure_ascii=False))
sys.exit(1 if bad else 0)
