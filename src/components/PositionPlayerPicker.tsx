import { useMemo, useState } from 'react'
import type { Player, Position } from '../types'
import { POSITION_LABELS } from '../lib/formations'
import { sortPlayers, SORT_OPTIONS, type SortKey } from '../lib/sortPlayers'
import { formatPts } from '../lib/format'
import { ConfirmModal } from './ConfirmModal'

type PositionPlayerPickerProps = {
  position: Position
  pool: Player[]
  budget: number
  participantName: string
  onBuy: (playerId: string) => void
  onClose: () => void
}

export function PositionPlayerPicker({ position, pool, budget, participantName, onBuy, onClose }: PositionPlayerPickerProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('overall-desc')
  const [showAll, setShowAll] = useState(false)
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)

  const positionOnly = useMemo(() => pool.filter((p) => p.position === position), [pool, position])
  const base = showAll ? pool : positionOnly

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? base.filter((p) => p.name.toLowerCase().includes(q)) : base
    return sortPlayers(list, sort)
  }, [base, search, sort])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-slate-700 bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-50">Escolher {POSITION_LABELS[position]}</h2>
            <p className="text-xs text-slate-500">{participantName} · saldo {formatPts(budget)}</p>
          </div>
          <button onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-300 transition">
            fechar
          </button>
        </div>

        <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogador..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {!showAll && positionOnly.length === 0 && (
          <div className="mx-5 mb-3 rounded-lg border border-amber-800/60 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
            Nenhum {POSITION_LABELS[position].toLowerCase()} disponível dentro do seu saldo agora.{' '}
            <button onClick={() => setShowAll(true)} className="font-semibold underline underline-offset-2">
              Ver todos os jogadores disponíveis
            </button>
          </div>
        )}
        {!showAll && positionOnly.length > 0 && (
          <button onClick={() => setShowAll(true)} className="mx-5 mb-3 self-start text-xs font-medium text-slate-500 hover:text-slate-300 transition">
            ver todos os jogadores disponíveis (não só {POSITION_LABELS[position].toLowerCase()})
          </button>
        )}
        {showAll && (
          <button onClick={() => setShowAll(false)} className="mx-5 mb-3 self-start text-xs font-medium text-emerald-400 hover:text-emerald-300 transition">
            ← voltar a filtrar por {POSITION_LABELS[position].toLowerCase()}
          </button>
        )}

        <ul className="flex-1 divide-y divide-slate-800/80 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Nenhum jogador encontrado.</p>
          ) : (
            filtered.map((p) => {
              const affordable = p.price <= budget
              return (
                <li key={p.id} className={`flex items-center justify-between gap-3 px-3 py-3 ${affordable ? '' : 'opacity-40'}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.position} · Overall {p.overall}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`text-sm font-semibold ${affordable ? 'text-emerald-400' : 'text-slate-500'}`}>{formatPts(p.price)}</span>
                    <button
                      disabled={!affordable}
                      onClick={() => setPendingPlayer(p)}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 active:scale-[0.98] transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                    >
                      Comprar
                    </button>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </div>

      {pendingPlayer && (
        <ConfirmModal
          title="Confirmar compra"
          description={`${participantName} vai comprar ${pendingPlayer.name} (${pendingPlayer.position}, overall ${pendingPlayer.overall}) por ${formatPts(pendingPlayer.price)}.`}
          confirmLabel="Comprar"
          onConfirm={() => {
            onBuy(pendingPlayer.id)
            setPendingPlayer(null)
          }}
          onCancel={() => setPendingPlayer(null)}
        />
      )}
    </div>
  )
}
