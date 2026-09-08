import type { Bracket, BracketMatch } from '../lib/bracket'
import { getChampion, needsGrandFinalReset, roundLabel } from '../lib/bracket'
import type { Participant } from '../types'

type BracketViewProps = {
  bracket: Bracket
  participants: Participant[]
  onSetWinner: (matchId: string, winnerId: string) => void
}

function MatchCard({
  match,
  nameOf,
  onSetWinner,
}: {
  match: BracketMatch
  nameOf: (id: string | null) => string | null
  onSetWinner: (matchId: string, winnerId: string) => void
}) {
  const nameA = nameOf(match.slotA)
  const nameB = nameOf(match.slotB)

  if (match.bye) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2">
        <p className="truncate text-sm font-semibold text-slate-200">{nameA ?? '—'}</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">folga — avança direto</p>
      </div>
    )
  }

  if (!nameA || !nameB) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/30">
        {[nameA, nameB].map((name, i) => (
          <div
            key={i}
            className={`px-3 py-2 text-sm ${i === 0 ? 'border-b border-slate-800' : ''} ${
              name ? 'font-medium text-slate-300' : 'text-slate-600'
            }`}
          >
            {name ?? 'aguardando…'}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900/60">
      {[match.slotA!, match.slotB!].map((id, i) => {
        const name = i === 0 ? nameA : nameB
        const isWinner = match.winner === id
        const isLoser = match.winner !== null && match.winner !== id
        return (
          <button
            key={id}
            onClick={() => onSetWinner(match.id, id)}
            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
              i === 0 ? 'border-b border-slate-800' : ''
            } ${
              isWinner
                ? 'bg-emerald-500/20 font-semibold text-emerald-300'
                : isLoser
                  ? 'text-slate-600'
                  : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="truncate">{name}</span>
            {isWinner && <span className="text-emerald-400">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

function BracketColumns({
  order,
  bracket,
  nameOf,
  onSetWinner,
  side,
}: {
  order: string[][]
  bracket: Bracket
  nameOf: (id: string | null) => string | null
  onSetWinner: (matchId: string, winnerId: string) => void
  side: 'upper' | 'lower'
}) {
  const totalRounds = order.length
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {order.map((roundIds, ri) => (
        <div key={ri} className="flex w-48 shrink-0 flex-col gap-3">
          <h4 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {roundLabel(ri, totalRounds, side)}
          </h4>
          <div className="flex flex-1 flex-col justify-around gap-3">
            {roundIds.map((id) => (
              <MatchCard key={id} match={bracket.matches[id]} nameOf={nameOf} onSetWinner={onSetWinner} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function BracketView({ bracket, participants, onSetWinner }: BracketViewProps) {
  const nameOf = (id: string | null) => (id ? (participants.find((p) => p.id === id)?.name ?? '?') : null)
  const championId = getChampion(bracket)

  if (bracket.type === 'single') {
    return (
      <div>
        {championId && (
          <div className="mb-4 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Campeão</p>
            <p className="text-xl font-bold text-amber-300">🏆 {nameOf(championId)}</p>
          </div>
        )}
        <BracketColumns order={bracket.upperOrder} bracket={bracket} nameOf={nameOf} onSetWinner={onSetWinner} side="upper" />
      </div>
    )
  }

  // duplo: chave superior, chave inferior, grande final (com reset se necessário)
  const gfMatch = bracket.grandFinalId ? bracket.matches[bracket.grandFinalId] : null
  const resetMatch = bracket.grandFinalResetId ? bracket.matches[bracket.grandFinalResetId] : null
  const resetNeeded = needsGrandFinalReset(bracket)
  const gfDecided = gfMatch?.winner != null

  return (
    <div>
      {championId && (
        <div className="mb-4 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Campeão</p>
          <p className="text-xl font-bold text-amber-300">🏆 {nameOf(championId)}</p>
        </div>
      )}

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-400">Chave superior</h3>
      <BracketColumns order={bracket.upperOrder} bracket={bracket} nameOf={nameOf} onSetWinner={onSetWinner} side="upper" />

      <h3 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-orange-400">Chave inferior</h3>
      <BracketColumns order={bracket.lowerOrder} bracket={bracket} nameOf={nameOf} onSetWinner={onSetWinner} side="lower" />

      <h3 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-emerald-400">Grande final</h3>
      <div className="flex flex-wrap gap-4">
        {gfMatch && (
          <div className="w-48">
            <MatchCard match={gfMatch} nameOf={nameOf} onSetWinner={onSetWinner} />
          </div>
        )}
        {(resetNeeded || (gfDecided && resetMatch?.winner)) && resetMatch && (
          <div className="w-48">
            <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-slate-500">Decisão (reset)</p>
            <MatchCard match={resetMatch} nameOf={nameOf} onSetWinner={onSetWinner} />
          </div>
        )}
      </div>
      {resetNeeded && (
        <p className="mt-2 text-xs text-slate-500">
          {nameOf(gfMatch!.winner)} venceu vindo da chave inferior — como ainda não perdeu duas vezes, tem decisão.
        </p>
      )}
    </div>
  )
}
