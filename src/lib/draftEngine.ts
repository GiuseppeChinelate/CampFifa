import type { DraftState, Participant, Player } from '../types'

function stepPointer(index: number, direction: 1 | -1, count: number): { index: number; direction: 1 | -1 } {
  const next = index + direction
  if (next < 0 || next >= count) {
    // Fim da rodada: o mesmo participante joga de novo, invertendo a direção (padrão snake).
    return { index, direction: (direction * -1) as 1 | -1 }
  }
  return { index: next, direction }
}

function remainingBudget(state: DraftState, participantId: string): number {
  return state.budget - (state.rosters[participantId]?.reduce((sum, p) => sum + p.price, 0) ?? 0)
}

function cheapestAvailablePrice(available: Player[]): number | null {
  if (available.length === 0) return null
  return Math.min(...available.map((p) => p.price))
}

/**
 * A partir do turnIndex/turnDirection atuais, avança pulando participantes que
 * não conseguem pagar o jogador mais barato disponível, registrando os pulos no log.
 * Encerra o draft automaticamente se ninguém no elenco puder comprar mais nada.
 */
function resolveTurn(state: DraftState): DraftState {
  let working = state
  const cheapest = cheapestAvailablePrice(working.available)

  if (cheapest === null) {
    return { ...working, phase: 'finished', log: [...working.log, { type: 'end', reason: 'sem-compradores' }] }
  }

  const n = working.order.length
  const anyoneCanAfford = working.order.some((pid) => remainingBudget(working, pid) >= cheapest)
  if (!anyoneCanAfford) {
    return { ...working, phase: 'finished', log: [...working.log, { type: 'end', reason: 'sem-compradores' }] }
  }

  let guard = 0
  while (guard < n * 2 + 2) {
    const currentId = working.order[working.turnIndex]
    if (remainingBudget(working, currentId) >= cheapest) {
      return working
    }
    working = {
      ...working,
      log: [...working.log, { type: 'skip', participantId: currentId, reason: 'saldo-insuficiente' }],
    }
    const { index, direction } = stepPointer(working.turnIndex, working.turnDirection, n)
    working = { ...working, turnIndex: index, turnDirection: direction }
    guard += 1
  }
  return { ...working, phase: 'finished', log: [...working.log, { type: 'end', reason: 'sem-compradores' }] }
}

export function createInitialDraftState(participants: Participant[], budget: number, players: Player[]): DraftState {
  const rosters: Record<string, Player[]> = {}
  participants.forEach((p) => {
    rosters[p.id] = []
  })

  const state: DraftState = {
    phase: 'live',
    budget,
    participants,
    order: participants.map((p) => p.id),
    available: players,
    rosters,
    turnIndex: 0,
    turnDirection: 1,
    log: [],
  }

  return resolveTurn(state)
}

export function pickPlayer(state: DraftState, participantId: string, playerId: string): DraftState {
  if (state.phase !== 'live') return state
  const currentId = state.order[state.turnIndex]
  if (currentId !== participantId) return state

  const player = state.available.find((p) => p.id === playerId)
  if (!player) return state

  if (remainingBudget(state, participantId) < player.price) return state

  const nextRosters = {
    ...state.rosters,
    [participantId]: [...state.rosters[participantId], player],
  }
  const nextAvailable = state.available.filter((p) => p.id !== playerId)

  const afterPick: DraftState = {
    ...state,
    available: nextAvailable,
    rosters: nextRosters,
    log: [...state.log, { type: 'pick', participantId, playerId: player.id, playerName: player.name, price: player.price }],
  }

  const n = afterPick.order.length
  const { index, direction } = stepPointer(afterPick.turnIndex, afterPick.turnDirection, n)
  const advanced: DraftState = { ...afterPick, turnIndex: index, turnDirection: direction }

  return resolveTurn(advanced)
}

export function endDraftManually(state: DraftState): DraftState {
  if (state.phase !== 'live') return state
  return { ...state, phase: 'finished', log: [...state.log, { type: 'end', reason: 'manual' }] }
}

export function getRemainingBudget(state: DraftState, participantId: string): number {
  return remainingBudget(state, participantId)
}

export function getSpent(state: DraftState, participantId: string): number {
  return state.budget - remainingBudget(state, participantId)
}

export function getCheapestAvailablePrice(state: DraftState): number | null {
  return cheapestAvailablePrice(state.available)
}

export function getCurrentParticipantId(state: DraftState): string | null {
  if (state.phase !== 'live') return null
  return state.order[state.turnIndex] ?? null
}
