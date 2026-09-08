import { useCallback, useEffect, useReducer } from 'react'
import type { DraftState, Participant, Player } from '../types'
import { createInitialDraftState, endDraftManually, pickPlayer } from '../lib/draftEngine'

export type SetupConfig = {
  participants: Participant[]
  budget: number
  players: Player[]
}

export type AppState = {
  config: SetupConfig
  draft: DraftState | null
}

const STORAGE_KEY = 'campfifa-draft-v1'

const emptyConfig: SetupConfig = {
  participants: [],
  budget: 1000,
  players: [],
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { config: emptyConfig, draft: null }
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.config) return { config: emptyConfig, draft: null }
    return parsed
  } catch {
    return { config: emptyConfig, draft: null }
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
  | { type: 'END_DRAFT' }
  | { type: 'EDIT_CONFIG' }
  | { type: 'RESTART_SAME_CONFIG' }
  | { type: 'RESET_ALL' }

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
      return { ...state, draft }
    }

    case 'PICK': {
      if (!state.draft) return state
      const draft = pickPlayer(state.draft, action.participantId, action.playerId)
      return { ...state, draft }
    }

    case 'END_DRAFT': {
      if (!state.draft) return state
      return { ...state, draft: endDraftManually(state.draft) }
    }

    case 'EDIT_CONFIG':
      return { ...state, draft: null }

    case 'RESTART_SAME_CONFIG': {
      const draft = createInitialDraftState(state.config.participants, state.config.budget, state.config.players)
      return { ...state, draft }
    }

    case 'RESET_ALL':
      return { config: emptyConfig, draft: null }

    default:
      return state
  }
}

export function useDraftStore() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // localStorage indisponível (modo privado, quota etc.) — segue só em memória.
    }
  }, [state])

  const setBudget = useCallback((budget: number) => dispatch({ type: 'SET_BUDGET', budget }), [])
  const addParticipant = useCallback((name: string) => dispatch({ type: 'ADD_PARTICIPANT', name }), [])
  const removeParticipant = useCallback((id: string) => dispatch({ type: 'REMOVE_PARTICIPANT', id }), [])
  const setPlayers = useCallback((players: Player[]) => dispatch({ type: 'SET_PLAYERS', players }), [])
  const removePlayer = useCallback((id: string) => dispatch({ type: 'REMOVE_PLAYER', id }), [])
  const startDraft = useCallback(() => dispatch({ type: 'START_DRAFT' }), [])
  const pick = useCallback((participantId: string, playerId: string) => dispatch({ type: 'PICK', participantId, playerId }), [])
  const endDraft = useCallback(() => dispatch({ type: 'END_DRAFT' }), [])
  const editConfig = useCallback(() => dispatch({ type: 'EDIT_CONFIG' }), [])
  const restartSameConfig = useCallback(() => dispatch({ type: 'RESTART_SAME_CONFIG' }), [])
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), [])

  return {
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
  }
}
