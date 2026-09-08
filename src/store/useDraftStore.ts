import { useCallback, useEffect, useReducer } from 'react'
import type { DraftState, FormationId, Participant, Player } from '../types'
import { chooseFormation, createInitialDraftState, endDraftManually, pickPlayer } from '../lib/draftEngine'
import { getDefaultPlayers } from '../lib/defaultPlayers'
import { generateBracket, setMatchWinner, type Bracket } from '../lib/bracket'
import type { DraftMode } from '../lib/modes'

export type SetupConfig = {
  participants: Participant[]
  budget: number
  players: Player[]
}

export type ResultsView = 'results' | 'bracket'

export type AppState = {
  config: SetupConfig
  draft: DraftState | null
  bracket: Bracket | null
  view: ResultsView
}

const STORAGE_PREFIX = 'campfifa-draft-v1'
const LEGACY_STORAGE_KEY = 'campfifa-draft-v1'

function storageKeyFor(mode: DraftMode): string {
  return `${STORAGE_PREFIX}:${mode}`
}

function createDefaultConfig(): SetupConfig {
  return {
    participants: [],
    budget: 1000,
    players: getDefaultPlayers(),
  }
}

function loadInitialState(mode: DraftMode): AppState {
  try {
    const raw = localStorage.getItem(storageKeyFor(mode))
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.config) return { ...parsed, bracket: parsed.bracket ?? null, view: parsed.view ?? 'results' }
    }
    // Compatibilidade com o estado salvo antes de existirem modos: adota como "normal".
    if (mode === 'normal') {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacy) {
        const parsed = JSON.parse(legacy) as AppState
        if (parsed.config) return { ...parsed, bracket: parsed.bracket ?? null, view: parsed.view ?? 'results' }
      }
    }
    return { config: createDefaultConfig(), draft: null, bracket: null, view: 'results' }
  } catch {
    return { config: createDefaultConfig(), draft: null, bracket: null, view: 'results' }
  }
}

export function peekModeSummary(mode: DraftMode): AppState | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(mode))
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    return parsed.config ? parsed : null
  } catch {
    return null
  }
}

type Action =
  | { type: 'SET_BUDGET'; budget: number }
  | { type: 'ADD_PARTICIPANT'; name: string }
  | { type: 'REMOVE_PARTICIPANT'; id: string }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'START_DRAFT' }
  | { type: 'PICK'; participantId: string; playerId: string }
  | { type: 'CHOOSE_FORMATION'; participantId: string; formation: FormationId }
  | { type: 'END_DRAFT' }
  | { type: 'EDIT_CONFIG' }
  | { type: 'RESTART_SAME_CONFIG' }
  | { type: 'RESET_ALL' }
  | { type: 'GENERATE_BRACKET' }
  | { type: 'SET_MATCH_WINNER'; matchId: string; winnerId: string }
  | { type: 'GO_TO_BRACKET' }
  | { type: 'GO_TO_RESULTS' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_BUDGET':
      return { ...state, config: { ...state.config, budget: Math.max(0, action.budget) } }

    case 'ADD_PARTICIPANT': {
      const name = action.name.trim()
      if (!name) return state
      if (state.config.participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) return state
      const participant: Participant = { id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, spent: 0 }
      return { ...state, config: { ...state.config, participants: [...state.config.participants, participant] } }
    }

    case 'REMOVE_PARTICIPANT':
      return { ...state, config: { ...state.config, participants: state.config.participants.filter((p) => p.id !== action.id) } }

    case 'SET_PLAYERS':
      return { ...state, config: { ...state.config, players: action.players } }

    case 'REMOVE_PLAYER':
      return { ...state, config: { ...state.config, players: state.config.players.filter((p) => p.id !== action.id) } }

    case 'START_DRAFT': {
      if (state.config.participants.length < 2 || state.config.players.length === 0) return state
      const draft = createInitialDraftState(state.config.participants, state.config.budget, state.config.players)
      return { ...state, draft, view: 'results' }
    }

    case 'PICK': {
      if (!state.draft) return state
      const draft = pickPlayer(state.draft, action.participantId, action.playerId)
      return { ...state, draft }
    }

    case 'CHOOSE_FORMATION': {
      if (!state.draft) return state
      const draft = chooseFormation(state.draft, action.participantId, action.formation)
      return { ...state, draft }
    }

    case 'END_DRAFT': {
      if (!state.draft) return state
      return { ...state, draft: endDraftManually(state.draft) }
    }

    case 'EDIT_CONFIG':
      return { ...state, draft: null, bracket: null, view: 'results' }

    case 'RESTART_SAME_CONFIG': {
      const draft = createInitialDraftState(state.config.participants, state.config.budget, state.config.players)
      return { ...state, draft, bracket: null, view: 'results' }
    }

    case 'RESET_ALL':
      return { config: createDefaultConfig(), draft: null, bracket: null, view: 'results' }

    case 'GENERATE_BRACKET': {
      if (!state.draft || state.draft.phase !== 'finished') return state
      const bracket = generateBracket(state.draft.order)
      return { ...state, bracket }
    }

    case 'SET_MATCH_WINNER': {
      if (!state.bracket) return state
      const bracket = setMatchWinner(state.bracket, action.matchId, action.winnerId)
      return { ...state, bracket }
    }

    case 'GO_TO_BRACKET':
      return { ...state, view: 'bracket' }

    case 'GO_TO_RESULTS':
      return { ...state, view: 'results' }

    default:
      return state
  }
}

export function useDraftStore(mode: DraftMode) {
  const [state, dispatch] = useReducer(reducer, mode, loadInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyFor(mode), JSON.stringify(state))
    } catch {
      // localStorage indisponível (modo privado, quota etc.) — segue só em memória.
    }
  }, [mode, state])

  const setBudget = useCallback((budget: number) => dispatch({ type: 'SET_BUDGET', budget }), [])
  const addParticipant = useCallback((name: string) => dispatch({ type: 'ADD_PARTICIPANT', name }), [])
  const removeParticipant = useCallback((id: string) => dispatch({ type: 'REMOVE_PARTICIPANT', id }), [])
  const setPlayers = useCallback((players: Player[]) => dispatch({ type: 'SET_PLAYERS', players }), [])
  const removePlayer = useCallback((id: string) => dispatch({ type: 'REMOVE_PLAYER', id }), [])
  const startDraft = useCallback(() => dispatch({ type: 'START_DRAFT' }), [])
  const pick = useCallback((participantId: string, playerId: string) => dispatch({ type: 'PICK', participantId, playerId }), [])
  const chooseFormationAction = useCallback(
    (participantId: string, formation: FormationId) => dispatch({ type: 'CHOOSE_FORMATION', participantId, formation }),
    [],
  )
  const endDraft = useCallback(() => dispatch({ type: 'END_DRAFT' }), [])
  const editConfig = useCallback(() => dispatch({ type: 'EDIT_CONFIG' }), [])
  const restartSameConfig = useCallback(() => dispatch({ type: 'RESTART_SAME_CONFIG' }), [])
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), [])
  const generateBracketAction = useCallback(() => dispatch({ type: 'GENERATE_BRACKET' }), [])
  const setMatchWinnerAction = useCallback(
    (matchId: string, winnerId: string) => dispatch({ type: 'SET_MATCH_WINNER', matchId, winnerId }),
    [],
  )
  const goToBracket = useCallback(() => dispatch({ type: 'GO_TO_BRACKET' }), [])
  const goToResults = useCallback(() => dispatch({ type: 'GO_TO_RESULTS' }), [])

  return {
    state,
    setBudget,
    addParticipant,
    removeParticipant,
    setPlayers,
    removePlayer,
    startDraft,
    pick,
    chooseFormation: chooseFormationAction,
    endDraft,
    editConfig,
    restartSameConfig,
    resetAll,
    generateBracket: generateBracketAction,
    setMatchWinner: setMatchWinnerAction,
    goToBracket,
    goToResults,
  }
}
