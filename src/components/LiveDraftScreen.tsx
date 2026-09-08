import { useMemo, useState } from 'react'
import type { DraftState, Player } from '../types'
import { getCurrentParticipantId, getRemainingBudget, getSpent } from '../lib/draftEngine'
import { formatPts } from '../lib/format'
import { ConfirmModal } from './ConfirmModal'

type LiveDraftScreenProps = {
  draft: DraftState
  pick: (participantId: string, playerId: string) => void
  endDraft: () => void
}

type SortKey = 'price-desc' | 'price-asc' | 'overall-desc' | 'overall-asc' | 'name-asc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'price-desc', label: 'Preço (maior → menor)' },
  { value: 'price-asc', label: 'Preço (menor → maior)' },
  { value: 'overall-desc', label: 'Overall (maior → menor)' },
  { value: 'overall-asc', label: 'Overall (menor → maior)' },
  { value: 'name-asc', label: 'Nome (A → Z)' },
]

function sortPlayers(players: Player[], sort: SortKey): Player[] {
  const list = [...players]
  switch (sort) {
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price)
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price)
    case 'overall-desc':
      return list.sort((a, b) => b.overall - a.overall)
    case 'overall-asc':
      return list.sort((a, b) => a.overall - b.overall)
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name))
  }
}

export function LiveDraftScreen({ draft, pick, endDraft }: LiveDraftScreenProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('price-desc')
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const currentId = getCurrentParticipantId(draft)
  const currentParticipant = draft.participants.find((p) => p.id === currentId) ?? null
  const currentBudget = currentId ? getRemainingBudget(draft, currentId) : 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q ? draft.available.filter((p) => p.name.toLowerCase().includes(q)) : draft.available
    return sortPlayers(base, sort)
  }, [draft.available, search, sort])

  const recentEvents = useMemo(() => draft.log.slice(-4).reverse(), [draft.log])

  function handleConfirmPick() {
    if (!pendingPlayer || !currentId) return
    pick(currentId, pendingPlayer.id)
    setPendingPlayer(null)
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      {/* Banner da vez atual */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-emerald-500/30 bg-slate-950/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:border-emerald-500/40 sm:bg-emerald-500/10 sm:px-6">
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Vez de</p>
            <p className="text-2xl font-bold text-slate-50 sm:text-3xl">
              {currentParticipant?.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400 sm:text-right">
              Saldo disponível
            </p>
            <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">{formatPts(currentBudget)}</p>
          </div>
        </div>
      </div>

      {recentEvents.length > 0 && (
        <div className="mb-6 space-y-1">
          {recentEvents.map((e, i) => {
            const participantName = draft.participants.find(
              (p) => p.id === ('participantId' in e ? e.participantId : ''),
            )?.name
            if (e.type === 'pick') {
              return (
                <p key={i} className="text-xs text-slate-500">
                  <span className="text-slate-300 font-medium">{participantName}</span> comprou{' '}
                  <span className="text-slate-300 font-medium">{e.playerName}</span> por {formatPts(e.price)}
                </p>
              )
            }
            if (e.type === 'skip') {
              return (
                <p key={i} className="text-xs text-amber-500/80">
                  <span className="font-medium">{participantName}</span> foi pulado — saldo insuficiente
                </p>
              )
            }
            return null
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Lista de jogadores */}
        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jogador..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Nenhum jogador encontrado.</p>
            ) : (
              <ul className="divide-y divide-slate-800/80 max-h-[60vh] overflow-y-auto">
                {filtered.map((p) => {
                  const affordable = p.price <= currentBudget
                  return (
                    <li
                      key={p.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 ${
                        affordable ? '' : 'opacity-40'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-500">Overall {p.overall}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-sm font-semibold ${affordable ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {formatPts(p.price)}
                        </span>
                        <button
                          disabled={!affordable || !currentId}
                          onClick={() => setPendingPlayer(p)}
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 active:scale-[0.98] transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                        >
                          Comprar
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Painel de participantes */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Participantes
            </h2>
            <ul className="space-y-2">
              {draft.order.map((id) => {
                const participant = draft.participants.find((p) => p.id === id)!
                const remaining = getRemainingBudget(draft, id)
                const spent = getSpent(draft, id)
                const count = draft.rosters[id]?.length ?? 0
                const isCurrent = id === currentId
                return (
                  <li
                    key={id}
                    className={`rounded-xl px-3 py-2.5 border transition ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isCurrent ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {participant.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                          na vez
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>{count} jogador{count !== 1 ? 'es' : ''}</span>
                      <span>gasto {formatPts(spent)}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-300">
                      saldo {formatPts(remaining)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <button
            onClick={() => setConfirmEnd(true)}
            className="w-full rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-950/60 active:scale-[0.98] transition"
          >
            Encerrar draft manualmente
          </button>
        </aside>
      </div>

      {pendingPlayer && currentParticipant && (
        <ConfirmModal
          title={`Confirmar compra`}
          description={`${currentParticipant.name} vai comprar ${pendingPlayer.name} (overall ${pendingPlayer.overall}) por ${formatPts(pendingPlayer.price)}.`}
          confirmLabel="Comprar"
          onConfirm={handleConfirmPick}
          onCancel={() => setPendingPlayer(null)}
        />
      )}

      {confirmEnd && (
        <ConfirmModal
          title="Encerrar o draft?"
          description="Isso finaliza o draft imediatamente e mostra o resultado final. Essa ação não pode ser desfeita."
          confirmLabel="Encerrar"
          danger
          onConfirm={() => {
            setConfirmEnd(false)
            endDraft()
          }}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </div>
  )
}
