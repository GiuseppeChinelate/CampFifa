export type Player = {
  id: string
  name: string
  overall: number
  price: number
}

export type Participant = {
  id: string
  name: string
  spent: number
}

export type DraftPhase = 'setup' | 'live' | 'finished'

export type LogEntry =
  | { type: 'pick'; participantId: string; playerId: string; playerName: string; price: number }
  | { type: 'skip'; participantId: string; reason: 'saldo-insuficiente' }
  | { type: 'end'; reason: 'sem-compradores' | 'manual' }

export type DraftState = {
  phase: DraftPhase
  budget: number
  participants: Participant[]
  order: string[]
  available: Player[]
  rosters: Record<string, Player[]>
  turnIndex: number
  turnDirection: 1 | -1
  log: LogEntry[]
}
