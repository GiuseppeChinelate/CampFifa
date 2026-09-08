export type BracketType = 'single' | 'double'
export type BracketSide = 'upper' | 'lower' | 'grand'

export type BracketMatch = {
  id: string
  side: BracketSide
  round: number
  slotA: string | null
  slotB: string | null
  winner: string | null
  bye: boolean
}

type Feed = { matchId: string; take: 'winner' | 'loser' } | null

type MatchSpec = {
  id: string
  side: BracketSide
  round: number
  feedA: Feed
  feedB: Feed
  bye: boolean
}

export type Bracket = {
  type: BracketType
  specs: Record<string, MatchSpec>
  matches: Record<string, BracketMatch>
  upperOrder: string[][]
  lowerOrder: string[][]
  grandFinalId: string | null
  grandFinalResetId: string | null
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

function emptyBracket(type: BracketType): Bracket {
  return { type, specs: {}, matches: {}, upperOrder: [], lowerOrder: [], grandFinalId: null, grandFinalResetId: null }
}

/** Pareia uma lista de "feeds" (entradas já resolvidas de onde tirar o próximo jogador) em partidas.
 * Sobra ímpar vira bye (avança direto, sem adversário). */
function pairFeeds(feeds: NonNullable<Feed>[], side: BracketSide, round: number, idPrefix: string): MatchSpec[] {
  const specs: MatchSpec[] = []
  for (let i = 0; i < feeds.length; i += 2) {
    const id = `${idPrefix}${specs.length}`
    if (i + 1 < feeds.length) {
      specs.push({ id, side, round, feedA: feeds[i], feedB: feeds[i + 1], bye: false })
    } else {
      specs.push({ id, side, round, feedA: feeds[i], feedB: null, bye: true })
    }
  }
  return specs
}

/** Cruza duas listas de origem (ex: sobreviventes da chave inferior x perdedores da chave
 * superior) 1 a 1. Quando uma lista é maior que a outra (comum quando teve bye acumulado),
 * quem sobra avança direto nessa rodada, sem travar o chaveamento. */
function dropIn(from: MatchSpec[], fromTake: 'winner' | 'loser', into: MatchSpec[], intoTake: 'winner' | 'loser', side: BracketSide, round: number, idPrefix: string): MatchSpec[] {
  const n = Math.max(from.length, into.length)
  const specs: MatchSpec[] = []
  for (let i = 0; i < n; i++) {
    const f = from[i]
    const u = into[i]
    const id = `${idPrefix}${specs.length}`
    if (f && u) {
      specs.push({ id, side, round, feedA: { matchId: f.id, take: fromTake }, feedB: { matchId: u.id, take: intoTake }, bye: false })
    } else if (f) {
      specs.push({ id, side, round, feedA: { matchId: f.id, take: fromTake }, feedB: null, bye: true })
    } else if (u) {
      specs.push({ id, side, round, feedA: { matchId: u.id, take: intoTake }, feedB: null, bye: true })
    }
  }
  return specs
}

function resolveFeed(matches: Record<string, BracketMatch>, feed: Feed): string | null {
  if (!feed) return null
  const m = matches[feed.matchId]
  if (!m) return null
  if (feed.take === 'winner') return m.winner
  if (m.bye || !m.winner) return null
  return m.winner === m.slotA ? m.slotB : m.slotA
}

/** Recalcula slotA/slotB/winner de cada partida, na ordem certa, a partir dos feeds e do
 * estado atual — byes se resolvem sozinhos assim que a única entrada deles fica conhecida,
 * e qualquer resultado que dependia de uma partida que mudou volta a ficar em aberto. */
function propagate(specs: Record<string, MatchSpec>, current: Record<string, BracketMatch>, order: string[]): Record<string, BracketMatch> {
  const next: Record<string, BracketMatch> = {}
  for (const id of order) {
    const spec = specs[id]
    const prev = current[id]
    const slotA = spec.feedA ? resolveFeed(next, spec.feedA) : prev.slotA
    const slotB = spec.feedB ? resolveFeed(next, spec.feedB) : prev.slotB
    const stillValid = slotA === prev.slotA && slotB === prev.slotB
    const winner = prev.bye ? slotA : stillValid ? prev.winner : null
    next[id] = { ...prev, slotA, slotB, winner }
  }
  return next
}

function buildUpperBracket(shuffled: string[], size: number, byesNeeded: number) {
  const specs: Record<string, MatchSpec> = {}
  const initial: Record<string, BracketMatch> = {}
  const upperOrder: string[][] = []

  const round0: MatchSpec[] = []
  let idx = 0
  for (let p = 0; p < size / 2; p++) {
    const id = `u-r0-m${p}`
    const spec: MatchSpec = { id, side: 'upper', round: 0, feedA: null, feedB: null, bye: p < byesNeeded }
    round0.push(spec)
    specs[id] = spec
    if (p < byesNeeded) {
      const a = shuffled[idx++]
      initial[id] = { id, side: 'upper', round: 0, slotA: a, slotB: null, winner: a, bye: true }
    } else {
      const a = shuffled[idx++]
      const b = shuffled[idx++]
      initial[id] = { id, side: 'upper', round: 0, slotA: a, slotB: b, winner: null, bye: false }
    }
  }
  upperOrder.push(round0.map((m) => m.id))

  let current = round0
  let roundIndex = 1
  while (current.length > 1) {
    const feeds = current.map((m): NonNullable<Feed> => ({ matchId: m.id, take: 'winner' }))
    const round = pairFeeds(feeds, 'upper', roundIndex, `u-r${roundIndex}-m`)
    round.forEach((spec) => {
      specs[spec.id] = spec
      initial[spec.id] = { id: spec.id, side: 'upper', round: roundIndex, slotA: null, slotB: null, winner: null, bye: spec.bye }
    })
    upperOrder.push(round.map((m) => m.id))
    current = round
    roundIndex++
  }

  return { specs, initial, upperOrder, upperRoundSpecs: upperOrder.map((ids) => ids.map((id) => specs[id])) }
}

/**
 * Sorteia os participantes num chaveamento. `single` = eliminação simples de sempre. `double`
 * = chave superior (eliminação simples normal) + chave inferior (quem perde na chave superior
 * cai lá e segue vivo até perder de novo) + grande final, com reset se quem vem da chave
 * inferior vencer a primeira grande final. Byes (quando sobra alguém sem par) acontecem tanto
 * na chave superior quanto na inferior — nunca trava o chaveamento por falta de par.
 */
export function generateBracket(participantIds: string[], type: BracketType = 'single'): Bracket {
  const shuffled = shuffle(participantIds)
  const n = shuffled.length
  if (n < 2) return emptyBracket(type)

  const size = nextPowerOfTwo(n)
  const k = Math.log2(size)
  const byesNeeded = size - n

  const { specs, initial, upperOrder, upperRoundSpecs } = buildUpperBracket(shuffled, size, byesNeeded)

  if (type === 'single') {
    const order = upperOrder.flat()
    const matches = propagate(specs, initial, order)
    return { type, specs, matches, upperOrder, lowerOrder: [], grandFinalId: null, grandFinalResetId: null }
  }

  // ---- chave inferior ----
  const lowerOrder: string[][] = []
  let lowerRoundIndex = 0

  function pushLowerRound(round: MatchSpec[]) {
    round.forEach((spec) => {
      specs[spec.id] = spec
      initial[spec.id] = { id: spec.id, side: 'lower', round: lowerRoundIndex, slotA: null, slotB: null, winner: null, bye: spec.bye }
    })
    lowerOrder.push(round.map((m) => m.id))
    lowerRoundIndex++
    return round
  }

  // rodada 0: perdedores da 1ª rodada da chave superior (ignorando quem teve bye lá, já que bye não gera perdedor)
  const round0RealSources = upperRoundSpecs[0].filter((m) => !m.bye).map((m): NonNullable<Feed> => ({ matchId: m.id, take: 'loser' }))
  let frontier = pushLowerRound(pairFeeds(round0RealSources, 'lower', lowerRoundIndex, `l-r${lowerRoundIndex}-m`))

  for (let ubRoundIdx = 1; ubRoundIdx < k; ubRoundIdx++) {
    const ubLosers = upperRoundSpecs[ubRoundIdx]
    frontier = pushLowerRound(dropIn(frontier, 'winner', ubLosers, 'loser', 'lower', lowerRoundIndex, `l-r${lowerRoundIndex}-m`))

    if (ubRoundIdx < k - 1) {
      const feeds = frontier.map((m): NonNullable<Feed> => ({ matchId: m.id, take: 'winner' }))
      frontier = pushLowerRound(pairFeeds(feeds, 'lower', lowerRoundIndex, `l-r${lowerRoundIndex}-m`))
    }
  }

  // salvaguarda: se sobrou mais de uma partida na ponta (bye acumulado em quantidades ímpares),
  // segue consolidando até fechar num só campeão da chave inferior.
  while (frontier.length > 1) {
    const feeds = frontier.map((m): NonNullable<Feed> => ({ matchId: m.id, take: 'winner' }))
    frontier = pushLowerRound(pairFeeds(feeds, 'lower', lowerRoundIndex, `l-r${lowerRoundIndex}-m`))
  }

  const upperFinalId = upperOrder[upperOrder.length - 1][0]
  const lowerFinalId = lowerOrder[lowerOrder.length - 1][0]

  const grandFinalId = 'gf'
  specs[grandFinalId] = {
    id: grandFinalId,
    side: 'grand',
    round: 0,
    feedA: { matchId: upperFinalId, take: 'winner' },
    feedB: { matchId: lowerFinalId, take: 'winner' },
    bye: false,
  }
  initial[grandFinalId] = { id: grandFinalId, side: 'grand', round: 0, slotA: null, slotB: null, winner: null, bye: false }

  const grandFinalResetId = 'gf-reset'
  specs[grandFinalResetId] = {
    id: grandFinalResetId,
    side: 'grand',
    round: 1,
    feedA: { matchId: upperFinalId, take: 'winner' },
    feedB: { matchId: lowerFinalId, take: 'winner' },
    bye: false,
  }
  initial[grandFinalResetId] = { id: grandFinalResetId, side: 'grand', round: 1, slotA: null, slotB: null, winner: null, bye: false }

  const order = [...upperOrder.flat(), ...lowerOrder.flat(), grandFinalId, grandFinalResetId]
  const matches = propagate(specs, initial, order)

  return { type, specs, matches, upperOrder, lowerOrder, grandFinalId, grandFinalResetId }
}

/**
 * Define o vencedor de uma partida e recalcula tudo que depende dela em cascata — inclusive
 * entre chave superior e inferior (perder na chave superior derruba pra chave inferior).
 */
export function setMatchWinner(bracket: Bracket, matchId: string, winnerId: string): Bracket {
  const spec = bracket.specs[matchId]
  const match = bracket.matches[matchId]
  if (!spec || !match || match.bye) return bracket
  if (winnerId !== match.slotA && winnerId !== match.slotB) return bracket

  const withWinner = { ...bracket.matches, [matchId]: { ...match, winner: winnerId } }
  const order = [...bracket.upperOrder.flat(), ...bracket.lowerOrder.flat(), bracket.grandFinalId, bracket.grandFinalResetId].filter(
    (id): id is string => id !== null,
  )
  const matches = propagate(bracket.specs, withWinner, order)
  return { ...bracket, matches }
}

export function roundLabel(roundIndex: number, totalRounds: number, side: BracketSide = 'upper'): string {
  const fromEnd = totalRounds - 1 - roundIndex
  const suffix = side === 'lower' ? ' CI' : side === 'upper' && totalRounds > 0 ? '' : ''
  if (side === 'lower') {
    if (fromEnd === 0) return 'Final CI'
    if (fromEnd === 1 && totalRounds > 1) return 'Semifinal CI'
    return `Rodada ${roundIndex + 1} CI`
  }
  switch (fromEnd) {
    case 0:
      return `Final${suffix}`
    case 1:
      return `Semifinal${suffix}`
    case 2:
      return `Quartas de final${suffix}`
    case 3:
      return `Oitavas de final${suffix}`
    default:
      return `Rodada ${roundIndex + 1}${suffix}`
  }
}

export function getChampion(bracket: Bracket): string | null {
  if (bracket.type === 'single') {
    const lastRound = bracket.upperOrder[bracket.upperOrder.length - 1]
    if (!lastRound || lastRound.length !== 1) return null
    return bracket.matches[lastRound[0]].winner
  }

  if (!bracket.grandFinalId) return null
  const gf = bracket.matches[bracket.grandFinalId]
  if (!gf.winner) return null

  const lowerFinalId = bracket.lowerOrder[bracket.lowerOrder.length - 1]?.[0]
  const lowerChampion = lowerFinalId ? bracket.matches[lowerFinalId]?.winner : null

  if (gf.winner !== lowerChampion || !lowerChampion) {
    // quem veio da chave superior venceu de cara -- acabou.
    return gf.winner
  }

  // quem veio da chave inferior venceu a 1ª grande final -- precisa da decisão (reset).
  if (!bracket.grandFinalResetId) return null
  return bracket.matches[bracket.grandFinalResetId]?.winner ?? null
}

/** Verdadeiro só quando a grande final foi decidida a favor de quem veio da chave inferior
 * e a partida de decisão (reset) ainda precisa ser jogada. */
export function needsGrandFinalReset(bracket: Bracket): boolean {
  if (bracket.type !== 'double' || !bracket.grandFinalId) return false
  const gf = bracket.matches[bracket.grandFinalId]
  if (!gf.winner) return false
  const lowerFinalId = bracket.lowerOrder[bracket.lowerOrder.length - 1]?.[0]
  const lowerChampion = lowerFinalId ? bracket.matches[lowerFinalId]?.winner : null
  return gf.winner === lowerChampion && lowerChampion !== null
}
