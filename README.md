# TCF Swipe Cards

Tinder-style French flashcards for TCF prep: 6,250 words in 125 decks of 50.

## Run
    npm install
    npm run dev           # local dev server
    npm run build         # normal build -> dist/
    npm run build:single  # one self-contained HTML file -> dist-single/index.html

## Accounts
See SETUP.md for Supabase + Netlify setup (sign up, password reset, synced progress).

## Data
`src/data/words.json` — one object per word:
`{ id, fr, pron, en, pos, ex, exEn, section, batch }`

French words, pronunciation cues, meanings and sections come from the
"French Vocabulary for the TCF Exam" guide (Kevin Andrin). Part of speech
(`pos`: n, v, adj, adv, prep, conj, pron, det, num, expr, interj) and the
example sentences (`ex`, `exEn`) were written for this app. Replace or edit
the file to swap the dataset; groups are built from it in order, 50 per deck.

After rebuilding the data with merge.py, `scripts-gender.py` adds articles/gender markers and the `g` field (m, f, m/f) for nouns.

Learned progress is stored in localStorage under `tcf-flashcards:learned:v1`.
