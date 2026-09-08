export type Position = 'GOL' | 'ZAG' | 'LD' | 'LE' | 'VOL' | 'MC' | 'MEI' | 'MD' | 'ME' | 'PD' | 'PE' | 'SA' | 'ATA'

export type FormationId = '4-4-2' | '4-3-3' | '4-2-3-1' | '3-5-2' | '3-4-3' | '5-3-2'

export type Player = {
  id: string
  name: string
  overall: number
  price: number
  position: Position
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
  | { type: 'formation'; participantId: string; formation: FormationId }

export type DraftState = {
  phase: DraftPhase
  budget: number
  participants: Participant[]
  order: string[]
  available: Player[]
  rosters: Record<string, Player[]>
  formations: Partial<Record<string, FormationId>>
  turnIndex: number
  turnDirection: 1 | -1
  log: LogEntry[]
}
