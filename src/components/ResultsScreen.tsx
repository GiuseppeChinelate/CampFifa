import type { DraftState } from '../types'
import { getRemainingBudget, getSpent } from '../lib/draftEngine'
import { formatPts } from '../lib/format'

type ResultsScreenProps = {
  draft: DraftState
  restartSameConfig: () => void
  editConfig: () => void
  resetAll: () => void
}

export function ResultsScreen({ draft, restartSameConfig, editConfig, resetAll }: ResultsScreenProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50">
          Draft encerrado 🏆
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">Confira o elenco final de cada participante.</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {draft.order.map((id) => {
          const participant = draft.participants.find((p) => p.id === id)!
          const roster = draft.rosters[id] ?? []
          const spent = getSpent(draft, id)
          const remaining = getRemainingBudget(draft, id)
          const sortedRoster = [...roster].sort((a, b) => b.price - a.price)

          return (
            <section key={id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-slate-50">{participant.name}</h2>
                <span className="text-xs text-slate-500">{roster.length} jogador{roster.length !== 1 ? 'es' : ''}</span>
              </div>

              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-slate-400">
                  gasto <span className="font-semibold text-slate-200">{formatPts(spent)}</span>
                </span>
                <span className="text-slate-400">
                  sobrou <span className="font-semibold text-emerald-400">{formatPts(remaining)}</span>
                </span>
              </div>

              {sortedRoster.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Nenhum jogador comprado.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-800/80 border-t border-slate-800">
                  {sortedRoster.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-200">{p.name}</span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-500">OVR {p.overall}</span>
                        <span className="font-medium text-emerald-400 w-16 text-right">{formatPts(p.price)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={restartSameConfig}
          className="w-full sm:w-auto rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition"
        >
          Novo draft (mesma configuração)
        </button>
        <button
          onClick={editConfig}
          className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 active:scale-[0.98] transition"
        >
          Editar configuração
        </button>
        <button
          onClick={resetAll}
          className="w-full sm:w-auto rounded-xl border border-slate-800 px-6 py-3 text-sm font-medium text-slate-500 hover:text-red-400 hover:border-red-800/60 active:scale-[0.98] transition"
        >
          Começar do zero
        </button>
      </div>
    </div>
  )
}
