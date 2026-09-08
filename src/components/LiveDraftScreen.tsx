import { useMemo, useState } from 'react'
import type { DraftState, Player, Position } from '../types'
import {
  getBenchCount,
  getBuyablePool,
  getCurrentParticipantId,
  getRemainingBudget,
  getSpent,
  isFormationComplete,
  isSquadFull,
  MAX_BENCH,
} from '../lib/draftEngine'
import { FORMATIONS } from '../lib/formations'
import { sortPlayers, SORT_OPTIONS, type SortKey } from '../lib/sortPlayers'
import { formatPts } from '../lib/format'
import { ConfirmModal } from './ConfirmModal'
import { FormationPicker } from './FormationPicker'
import { PositionGrid } from './PositionGrid'
import { PositionPlayerPicker } from './PositionPlayerPicker'
import type { DraftMode } from '../lib/modes'
import type { FormationId } from '../types'
import { ModeBar } from './ModeBar'

type LiveDraftScreenProps = {
  mode: DraftMode
  onHome: () => void
  draft: DraftState
  pick: (participantId: string, playerId: string) => void
  chooseFormation: (participantId: string, formation: FormationId) => void
  endDraft: () => void
}

export function LiveDraftScreen({ mode, onHome, draft, pick, chooseFormation, endDraft }: LiveDraftScreenProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('price-desc')
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [openSlot, setOpenSlot] = useState<Position | null>(null)

  const currentId = getCurrentParticipantId(draft)
  const currentParticipant = draft.participants.find((p) => p.id === currentId) ?? null
  const currentBudget = currentId ? getRemainingBudget(draft, currentId) : 0
  const currentFormationId = currentId ? draft.formations[currentId] : undefined
  const currentFormation = currentFormationId ? FORMATIONS[currentFormationId] : null
  const currentRoster = currentId ? (draft.rosters[currentId] ?? []) : []
  const formationComplete = currentId ? isFormationComplete(draft, currentId) : false
  const benchCount = currentId ? getBenchCount(draft, currentId) : 0
  const squadFull = currentId ? isSquadFull(draft, currentId) : false
  const buyablePool = currentId ? getBuyablePool(draft, currentId) : []

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
      <ModeBar mode={mode} onHome={onHome} />
      {/* Banner da vez atual */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-emerald-500/30 bg-slate-950/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:border-emerald-500/40 sm:bg-emerald-500/10 sm:px-6">
        <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Vez de</p>
            <p className="text-2xl font-bold text-slate-50 sm:text-3xl">
              {currentParticipant?.name ?? '—'}
            </p>
            {currentFormationId && (
              <p className="text-xs text-slate-400">
                {currentFormation!.label} {formationComplete ? `· reservas ${benchCount}/${MAX_BENCH}` : ''}
              </p>
            )}
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
            if (e.type === 'formation') {
              return (
                <p key={i} className="text-xs text-slate-500">
                  <span className="text-slate-300 font-medium">{participantName}</span> escolheu a formação{' '}
                  <span className="text-slate-300 font-medium">{e.formation}</span>
                </p>
              )
            }
            return null
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Área principal: formação / campo / lista livre */}
        <section className="space-y-4">
          {!currentFormationId && currentParticipant && (
            <FormationPicker
              participantName={currentParticipant.name}
              onChoose={(formation) => chooseFormation(currentParticipant.id, formation)}
            />
          )}

          {currentFormation && (
            <PositionGrid formation={currentFormation} roster={currentRoster} onSlotClick={(position) => setOpenSlot(position)} />
          )}

          {currentFormationId && formationComplete && squadFull && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
              Elenco fechado — {MAX_BENCH} reservas já contratados, mesmo com saldo sobrando. Aguardando os outros participantes.
            </div>
          )}

          {currentFormationId && formationComplete && !squadFull && (
            <>
              <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
                Time titular completo — reforce o banco com qualquer jogador disponível (limite de {MAX_BENCH} reservas, faltam {MAX_BENCH - benchCount}).
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
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
                            <p className="text-xs text-slate-500">
                              {p.position} · Overall {p.overall}
                            </p>
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
            </>
          )}
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
                const formationId = draft.formations[id]
                const complete = isFormationComplete(draft, id)
                const bench = getBenchCount(draft, id)
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
                      {isCurrent ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                          na vez
                        </span>
                      ) : formationId ? (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{formationId}</span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>
                        {count} jogador{count !== 1 ? 'es' : ''}
                        {complete && ` · reservas ${bench}/${MAX_BENCH}`}
                      </span>
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

      {openSlot && currentId && currentParticipant && (
        <PositionPlayerPicker
          position={openSlot}
          pool={buyablePool}
          budget={currentBudget}
          participantName={currentParticipant.name}
          onBuy={(playerId) => {
            pick(currentId, playerId)
            setOpenSlot(null)
          }}
          onClose={() => setOpenSlot(null)}
        />
      )}

      {pendingPlayer && currentParticipant && (
        <ConfirmModal
          title={`Confirmar compra`}
          description={`${currentParticipant.name} vai comprar ${pendingPlayer.name} (${pendingPlayer.position}, overall ${pendingPlayer.overall}) por ${formatPts(pendingPlayer.price)}.`}
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
