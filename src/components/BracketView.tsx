import type { Bracket } from '../lib/bracket'
import { getChampion, roundLabel } from '../lib/bracket'
import type { Participant } from '../types'

type BracketViewProps = {
  bracket: Bracket
  participants: Participant[]
  onSetWinner: (matchId: string, winnerId: string) => void
}

export function BracketView({ bracket, participants, onSetWinner }: BracketViewProps) {
  const nameOf = (id: string | null) => (id ? (participants.find((p) => p.id === id)?.name ?? '?') : null)
  const totalRounds = bracket.rounds.length
  const championId = getChampion(bracket)

  return (
    <div>
      {championId && (
        <div className="mb-4 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Campeão</p>
          <p className="text-xl font-bold text-amber-300">🏆 {nameOf(championId)}</p>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {bracket.rounds.map((round, ri) => (
          <div key={ri} className="flex w-48 shrink-0 flex-col gap-3">
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {roundLabel(ri, totalRounds)}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {round.map((match) => {
                const nameA = nameOf(match.slotA)
                const nameB = nameOf(match.slotB)

                if (match.bye) {
                  return (
                    <div key={match.id} className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-200">{nameA}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">folga — avança direto</p>
                    </div>
                  )
                }

                if (!nameA || !nameB) {
                  return (
                    <div key={match.id} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/30">
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
                  <div key={match.id} className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900/60">
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
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
