import { useEffect, useMemo, useState } from 'react'
import AccountPanel from './components/AccountPanel'
import DeckSelector from './components/DeckSelector'
import DeckView from './components/DeckView'
import ExamGuide from './components/ExamGuide'
import SampleExams from './components/SampleExams'
import Welcome from './components/Welcome'
import { useAccount } from './lib/account'
import { useProgress } from './lib/progress'
import { dueIds, REVIEW_SESSION } from './lib/srs'
import { usePref } from './lib/storage'
import { GROUPS } from './lib/words'

export default function App() {
  const progress = useProgress()
  const account = useAccount(progress)
  const [mode, setMode] = usePref('tcf-flashcards:mode', 'learn')
  const [direction, setDirection] = usePref('tcf-flashcards:direction', 'fr-en')
  const [theme, setTheme] = usePref('tcf-flashcards:theme', 'classic')
  // Study modes, switched in Profile → Settings
  const [reverse, setReverse] = usePref('tcf-flashcards:reverse', 'off')
  const [typing, setTyping] = usePref('tcf-flashcards:typing', 'off')
  const [listen, setListen] = usePref('tcf-flashcards:listen', 'off')
  const [reviewIds, setReviewIds] = useState([])
  const [groupIndex, setGroupIndex] = useState(null)
  const [showAccount, setShowAccount] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showExams, setShowExams] = useState(false)
  const [batchFilter, setBatchFilter] = useState(0)

  // The liquid glass look is a class on <html>; index.css restyles the app's surfaces under it
  useEffect(() => {
    document.documentElement.classList.toggle('theme-glass', theme === 'glass')
  }, [theme])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [groupIndex, showAccount, showGuide, showExams])

  // Signing out sends you back to the welcome screen; signing in again opens the decks
  useEffect(() => {
    if (!account.user && !account.recovering) {
      setShowAccount(false)
      setShowGuide(false)
      setShowExams(false)
      setGroupIndex(null)
    }
  }, [account.user, account.recovering])

  // A password-reset link lands here: go straight to the new-password form
  useEffect(() => {
    if (account.recovering) {
      setGroupIndex(null)
      setShowAccount(true)
    }
  }, [account.recovering])

  // A group unlocks for the exam once all 50 of its words are learned
  const learnedIds = progress.learned.ids
  const completed = useMemo(
    () => GROUPS.filter((g) => g.ids.every((id) => learnedIds.has(id))).map((g) => g.index),
    [learnedIds]
  )

  const due = useMemo(() => dueIds(learnedIds, progress.srs), [learnedIds, progress.srs])

  const isExam = mode === 'exam'
  const list = isExam ? progress[direction] : progress.learned

  // What the card front shows: listening hides the word; reverse and typing show the English.
  // In Exam mode the chosen direction decides between French and English.
  const prompt = listen === 'on' ? 'audio' : isExam ? (direction === 'en-fr' ? 'en' : 'fr') : reverse === 'on' || typing === 'on' ? 'en' : 'fr'
  const study = { prompt, typing: typing === 'on' && prompt !== 'fr' }
  const settings = {
    reverse: reverse === 'on',
    typing: typing === 'on',
    listen: listen === 'on',
    set: (key, on) => ({ reverse: setReverse, typing: setTyping, listen: setListen })[key](on ? 'on' : 'off'),
  }
  const available = isExam ? completed : GROUPS.map((g) => g.index)

  const open = (i) => setGroupIndex(i)
  // Review takes a snapshot of what's due, so the deck doesn't shift while you swipe
  const openReview = () => {
    setReviewIds(due.slice(0, REVIEW_SESSION))
    setGroupIndex('review')
  }

  // With accounts switched on, nothing is reachable until you sign in
  if (account.enabled && !account.user && !account.recovering) return <Welcome account={account} />

  if (showExams) return <SampleExams onBack={() => setShowExams(false)} />
  if (showGuide) return <ExamGuide onBack={() => setShowGuide(false)} />

  if (showAccount && account.enabled) {
    return (
      <AccountPanel
        account={account}
        progress={progress}
        theme={theme}
        setTheme={setTheme}
        settings={settings}
        onOpenGuide={() => setShowGuide(true)}
        onOpenExams={() => setShowExams(true)}
        onBack={() => {
          account.cancelRecovery()
          setShowAccount(false)
        }}
      />
    )
  }

  if (groupIndex) {
    const nextIndex = available.find((i) => i > groupIndex) ?? null
    return (
      <DeckView
        key={`${mode}-${direction}-${groupIndex}-${prompt}-${study.typing}`}
        mode={mode}
        direction={direction}
        study={study}
        groupIndex={groupIndex}
        reviewIds={reviewIds}
        progress={progress}
        known={list.ids}
        markKnown={list.mark}
        unmark={list.unmark}
        resetIds={list.resetIds}
        nextIndex={groupIndex === 'review' ? null : nextIndex}
        onBack={() => setGroupIndex(null)}
        onOpenGroup={open}
      />
    )
  }

  return (
    <DeckSelector
      mode={mode}
      setMode={setMode}
      direction={direction}
      setDirection={setDirection}
      known={list.ids}
      available={available}
      onOpen={open}
      dueCount={due.length}
      onReview={openReview}
      stats={progress.stats}
      batch={batchFilter}
      setBatch={setBatchFilter}
      account={account}
      onAccount={() => setShowAccount(true)}
    />
  )
}
