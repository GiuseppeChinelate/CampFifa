import type { DraftState, FormationId, Participant, Player, Position } from '../types'
import { FORMATIONS } from './formations'

export const MAX_BENCH = 5

function totalFormationSlots(formationId: FormationId): number {
  return FORMATIONS[formationId].slots.reduce((sum, s) => sum + s.coords.length, 0)
}

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

function cheapestPrice(pool: Player[]): number | null {
  if (pool.length === 0) return null
  return Math.min(...pool.map((p) => p.price))
}

/**
 * Quantas unidades de cada posição ainda faltam pro participante completar a formação
 * escolhida. Mapa vazio = formação completa (ou sem formação, tratado à parte).
 */
function remainingPositionCounts(state: DraftState, participantId: string): Map<Position, number> {
  const formationId = state.formations[participantId]
  const remaining = new Map<Position, number>()
  if (!formationId) return remaining

  const owned = new Map<Position, number>()
  for (const p of state.rosters[participantId] ?? []) {
    owned.set(p.position, (owned.get(p.position) ?? 0) + 1)
  }

  for (const slot of FORMATIONS[formationId].slots) {
    const have = owned.get(slot.position) ?? 0
    const need = slot.coords.length - have
    if (need > 0) remaining.set(slot.position, need)
  }
  return remaining
}

/**
 * Quantos reservas (jogadores além dos titulares da formação) o participante já comprou.
 * Só faz sentido depois que a formação está completa; antes disso é sempre 0.
 */
function benchCount(state: DraftState, participantId: string): number {
  const formationId = state.formations[participantId]
  if (!formationId) return 0
  if (remainingPositionCounts(state, participantId).size > 0) return 0
  const rosterSize = state.rosters[participantId]?.length ?? 0
  return Math.max(0, rosterSize - totalFormationSlots(formationId))
}

export function getBenchCount(state: DraftState, participantId: string): number {
  return benchCount(state, participantId)
}

/**
 * Jogadores que o participante pode comprar agora: enquanto a formação escolhida não
 * está completa, só os das posições que ainda faltam (times sem formação escolhida
 * ainda compram livremente, já que ainda não sabemos as posições que vão precisar). Se
 * nenhum jogador disponível cobre as posições em aberto, a restrição relaxa pra não
 * travar o draft. Com a formação completa, compra livre até o limite de MAX_BENCH
 * reservas — depois disso, mesmo sobrando saldo, não compra mais nada.
 */
export function getBuyablePool(state: DraftState, participantId: string): Player[] {
  const formationId = state.formations[participantId]
  if (!formationId) return state.available

  const remaining = remainingPositionCounts(state, participantId)
  if (remaining.size === 0) {
    return benchCount(state, participantId) >= MAX_BENCH ? [] : state.available
  }

  const filtered = state.available.filter((p) => remaining.has(p.position))
  return filtered.length > 0 ? filtered : state.available
}

function participantCanAffordSomething(state: DraftState, participantId: string): boolean {
  const cheapest = cheapestPrice(getBuyablePool(state, participantId))
  return cheapest !== null && remainingBudget(state, participantId) >= cheapest
}

/**
 * A partir do turnIndex/turnDirection atuais, avança pulando participantes que
 * não conseguem pagar nenhum jogador comprável agora, registrando os pulos no log.
 * Encerra o draft automaticamente se ninguém no elenco puder comprar mais nada.
 */
function resolveTurn(state: DraftState): DraftState {
  let working = state
  const n = working.order.length

  const anyoneCanAfford = working.order.some((pid) => participantCanAffordSomething(working, pid))
  if (!anyoneCanAfford) {
    return { ...working, phase: 'finished', log: [...working.log, { type: 'end', reason: 'sem-compradores' }] }
  }

  let guard = 0
  while (guard < n * 2 + 2) {
    const currentId = working.order[working.turnIndex]
    if (participantCanAffordSomething(working, currentId)) {
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
    formations: {},
    turnIndex: 0,
    turnDirection: 1,
    log: [],
  }

  return resolveTurn(state)
}

export function chooseFormation(state: DraftState, participantId: string, formationId: FormationId): DraftState {
  if (state.phase !== 'live') return state
  if (state.order[state.turnIndex] !== participantId) return state
  if (state.formations[participantId]) return state

  return {
    ...state,
    formations: { ...state.formations, [participantId]: formationId },
    log: [...state.log, { type: 'formation', participantId, formation: formationId }],
  }
}

export function pickPlayer(state: DraftState, participantId: string, playerId: string): DraftState {
  if (state.phase !== 'live') return state
  const currentId = state.order[state.turnIndex]
  if (currentId !== participantId) return state

  const player = state.available.find((p) => p.id === playerId)
  if (!player) return state
  if (!state.formations[participantId]) return state // precisa escolher a formação antes de comprar

  if (remainingBudget(state, participantId) < player.price) return state
  if (!getBuyablePool(state, participantId).some((p) => p.id === playerId)) return state

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
  return cheapestPrice(state.available)
}

export function getCurrentParticipantId(state: DraftState): string | null {
  if (state.phase !== 'live') return null
  return state.order[state.turnIndex] ?? null
}

export function getRemainingPositionCounts(state: DraftState, participantId: string): Map<Position, number> {
  return remainingPositionCounts(state, participantId)
}

export function isFormationComplete(state: DraftState, participantId: string): boolean {
  const formationId = state.formations[participantId]
  if (!formationId) return false
  return remainingPositionCounts(state, participantId).size === 0
}

export function isSquadFull(state: DraftState, participantId: string): boolean {
  return isFormationComplete(state, participantId) && benchCount(state, participantId) >= MAX_BENCH
}
