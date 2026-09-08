import { useDraftStore } from './store/useDraftStore'
import { SetupScreen } from './components/SetupScreen'
import { LiveDraftScreen } from './components/LiveDraftScreen'
import { ResultsScreen } from './components/ResultsScreen'

function App() {
  const {
    state,
    setBudget,
    addParticipant,
    removeParticipant,
    setPlayers,
    removePlayer,
    startDraft,
    pick,
    endDraft,
    editConfig,
    restartSameConfig,
    resetAll,
  } = useDraftStore()

  if (!state.draft) {
    return (
      <SetupScreen
        config={state.config}
        addParticipant={addParticipant}
        removeParticipant={removeParticipant}
        setBudget={setBudget}
        setPlayers={setPlayers}
        removePlayer={removePlayer}
        startDraft={startDraft}
      />
    )
  }

  if (state.draft.phase === 'live') {
    return <LiveDraftScreen draft={state.draft} pick={pick} endDraft={endDraft} />
  }

  return (
    <ResultsScreen
      draft={state.draft}
      restartSameConfig={restartSameConfig}
      editConfig={editConfig}
      resetAll={resetAll}
    />
  )
}

export default App
