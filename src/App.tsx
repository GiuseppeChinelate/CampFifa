import { useState } from 'react'
import { useDraftStore } from './store/useDraftStore'
import { SetupScreen } from './components/SetupScreen'
import { LiveDraftScreen } from './components/LiveDraftScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { BracketScreen } from './components/BracketScreen'
import { HomeScreen } from './components/HomeScreen'
import type { DraftMode } from './lib/modes'

const MODE_STORAGE_KEY = 'campfifa-selected-mode'

function loadSelectedMode(): DraftMode | null {
  try {
    const raw = localStorage.getItem(MODE_STORAGE_KEY)
    return raw === 'normal' || raw === 'cirrose' ? raw : null
  } catch {
    return null
  }
}

function DraftApp({ mode, onHome }: { mode: DraftMode; onHome: () => void }) {
  const {
    state,
    setBudget,
    setBracketType,
    addParticipant,
    removeParticipant,
    setPlayers,
    removePlayer,
    startDraft,
    pick,
    chooseFormation,
    endDraft,
    editConfig,
    restartSameConfig,
    resetAll,
    generateBracket,
    setMatchWinner,
    goToBracket,
    goToResults,
  } = useDraftStore(mode)

  if (!state.draft) {
    return (
      <SetupScreen
        mode={mode}
        onHome={onHome}
        config={state.config}
        addParticipant={addParticipant}
        removeParticipant={removeParticipant}
        setBudget={setBudget}
        setBracketType={setBracketType}
        setPlayers={setPlayers}
        removePlayer={removePlayer}
        startDraft={startDraft}
      />
    )
  }

  if (state.draft.phase === 'live') {
    return (
      <LiveDraftScreen
        mode={mode}
        onHome={onHome}
        draft={state.draft}
        pick={pick}
        chooseFormation={chooseFormation}
        endDraft={endDraft}
      />
    )
  }

  if (state.view === 'bracket') {
    return (
      <BracketScreen
        mode={mode}
        onHome={onHome}
        draft={state.draft}
        bracket={state.bracket}
        generateBracket={generateBracket}
        setMatchWinner={setMatchWinner}
        goToResults={goToResults}
      />
    )
  }

  return (
    <ResultsScreen
      mode={mode}
      onHome={onHome}
      draft={state.draft}
      goToBracket={goToBracket}
      restartSameConfig={restartSameConfig}
      editConfig={editConfig}
      resetAll={resetAll}
    />
  )
}

function App() {
  const [mode, setMode] = useState<DraftMode | null>(loadSelectedMode)

  function selectMode(next: DraftMode) {
    setMode(next)
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next)
    } catch {
      // localStorage indisponível — a seleção só dura a sessão atual.
    }
  }

  function goHome() {
    setMode(null)
    try {
      localStorage.removeItem(MODE_STORAGE_KEY)
    } catch {
      // idem
    }
  }

  if (!mode) {
    return <HomeScreen onSelect={selectMode} />
  }

  return <DraftApp key={mode} mode={mode} onHome={goHome} />
}

export default App
