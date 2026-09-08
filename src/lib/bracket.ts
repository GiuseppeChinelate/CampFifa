export type BracketMatch = {
  id: string
  round: number
  slotA: string | null
  slotB: string | null
  winner: string | null
  bye: boolean
}

export type Bracket = {
  rounds: BracketMatch[][]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nextPowerOfTwo(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * Sorteia os participantes num chaveamento eliminatório simples. Só a 1ª rodada pode
 * ficar ímpar (aí quem sobra folga e avança direto sem jogar) — a partir da rodada
 * seguinte o número de jogos sempre fecha em potência de 2, então nunca mais sobra
 * ninguém sem par.
 */
export function generateBracket(participantIds: string[]): Bracket {
  const shuffled = shuffle(participantIds)
  const n = shuffled.length
  if (n < 2) return { rounds: [] }

  const size = nextPowerOfTwo(n)
  const numPairs = size / 2
  const byesNeeded = size - n

  const round1: BracketMatch[] = []
  let idx = 0
  for (let p = 0; p < numPairs; p++) {
    if (p < byesNeeded) {
      const a = shuffled[idx++]
      round1.push({ id: `r0-m${p}`, round: 0, slotA: a, slotB: null, winner: a, bye: true })
    } else {
      const a = shuffled[idx++]
      const b = shuffled[idx++]
      round1.push({ id: `r0-m${p}`, round: 0, slotA: a, slotB: b, winner: null, bye: false })
    }
  }

  const rounds: BracketMatch[][] = [round1]
  let current = round1
  let roundIndex = 1
  while (current.length > 1) {
    const next: BracketMatch[] = []
    for (let i = 0; i < current.length; i += 2) {
      next.push({
        id: `r${roundIndex}-m${i / 2}`,
        round: roundIndex,
        slotA: current[i].winner,
        slotB: current[i + 1].winner,
        winner: null,
        bye: false,
      })
    }
    rounds.push(next)
    current = next
    roundIndex++
  }

  return { rounds }
}

/**
 * Define o vencedor de uma partida e recalcula as rodadas seguintes a partir dela —
 * qualquer resultado que dependia de um confronto que mudou volta a ficar em aberto.
 */
export function setMatchWinner(bracket: Bracket, matchId: string, winnerId: string): Bracket {
  const rounds = bracket.rounds.map((round) => round.map((m) => ({ ...m })))

  let found = false
  for (const round of rounds) {
    const match = round.find((m) => m.id === matchId)
    if (match && !match.bye) {
      match.winner = winnerId
      found = true
      break
    }
  }
  if (!found) return bracket

  for (let r = 1; r < rounds.length; r++) {
    const prev = rounds[r - 1]
    rounds[r] = rounds[r].map((m, i) => {
      const a = prev[i * 2]?.winner ?? null
      const b = prev[i * 2 + 1]?.winner ?? null
      const stillValid = m.slotA === a && m.slotB === b
      return { ...m, slotA: a, slotB: b, winner: stillValid ? m.winner : null }
    })
  }

  return { rounds }
}

export function roundLabel(roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - roundIndex
  switch (fromEnd) {
    case 0:
      return 'Final'
    case 1:
      return 'Semifinal'
    case 2:
      return 'Quartas de final'
    case 3:
      return 'Oitavas de final'
    default:
      return `Rodada ${roundIndex + 1}`
  }
}

export function getChampion(bracket: Bracket): string | null {
  const lastRound = bracket.rounds[bracket.rounds.length - 1]
  if (!lastRound || lastRound.length !== 1) return null
  return lastRound[0].winner
}
