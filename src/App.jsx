import { useEffect, useMemo, useState } from 'react'
import AccountPanel from './components/AccountPanel'
import DeckSelector from './components/DeckSelector'
import DeckView from './components/DeckView'
import Welcome from './components/Welcome'
import { useAccount } from './lib/account'
import { useProgress } from './lib/progress'
import { usePref } from './lib/storage'
import { GROUPS } from './lib/words'

export default function App() {
  const progress = useProgress()
  const account = useAccount(progress)
  const [mode, setMode] = usePref('tcf-flashcards:mode', 'learn')
  const [direction, setDirection] = usePref('tcf-flashcards:direction', 'fr-en')
  const [groupIndex, setGroupIndex] = useState(null)
  const [showAccount, setShowAccount] = useState(false)
  const [batchFilter, setBatchFilter] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [groupIndex, showAccount])

  // Signing out sends you back to the welcome screen; signing in again opens the decks
  useEffect(() => {
    if (!account.user && !account.recovering) {
      setShowAccount(false)
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

  const isExam = mode === 'exam'
  const list = isExam ? progress[direction] : progress.learned
  const available = isExam ? completed : GROUPS.map((g) => g.index)

  const open = (i) => setGroupIndex(i)

  // With accounts switched on, nothing is reachable until you sign in
  if (account.enabled && !account.user && !account.recovering) return <Welcome account={account} />

  if (showAccount && account.enabled) {
    return (
      <AccountPanel
        account={account}
        progress={progress}
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
        key={`${mode}-${direction}-${groupIndex}`}
        mode={mode}
        direction={direction}
        groupIndex={groupIndex}
        known={list.ids}
        markKnown={list.mark}
        unmark={list.unmark}
        resetIds={list.resetIds}
        nextIndex={nextIndex}
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
      batch={batchFilter}
      setBatch={setBatchFilter}
      account={account}
      onAccount={() => setShowAccount(true)}
    />
  )
}
