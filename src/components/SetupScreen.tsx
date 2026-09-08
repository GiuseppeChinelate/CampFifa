import { useMemo, useState } from 'react'
import type { SetupConfig } from '../store/useDraftStore'
import { parsePlayersBulkText } from '../lib/parsePlayers'
import { formatPts } from '../lib/format'
import { priceForOverall } from '../lib/pricing'

type SetupScreenProps = {
  config: SetupConfig
  addParticipant: (name: string) => void
  removeParticipant: (id: string) => void
  setBudget: (budget: number) => void
  setPlayers: (players: SetupConfig['players']) => void
  removePlayer: (id: string) => void
  startDraft: () => void
}

export function SetupScreen({
  config,
  addParticipant,
  removeParticipant,
  setBudget,
  setPlayers,
  removePlayer,
  startDraft,
}: SetupScreenProps) {
  const [nameInput, setNameInput] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [playerFilter, setPlayerFilter] = useState('')

  const canStart = config.participants.length >= 2 && config.players.length >= 1

  function handleAddParticipant() {
    if (!nameInput.trim()) return
    addParticipant(nameInput)
    setNameInput('')
  }

  function handleParseBulk() {
    if (!bulkText.trim()) return
    const results = parsePlayersBulkText(bulkText)
    const newPlayers = results.filter((r) => r.player).map((r) => r.player!)
    const errors = results.filter((r) => r.error).map((r) => `"${r.raw}" — ${r.error}`)

    const existingNames = new Set(config.players.map((p) => p.name.toLowerCase()))
    const deduped = newPlayers.filter((p) => !existingNames.has(p.name.toLowerCase()))

    setPlayers([...config.players, ...deduped])
    setParseErrors(errors)
    setBulkText('')
  }

  const filteredPlayers = useMemo(() => {
    const q = playerFilter.trim().toLowerCase()
    if (!q) return config.players
    return config.players.filter((p) => p.name.toLowerCase().includes(q))
  }, [config.players, playerFilter])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50">
          Configurar Draft ⚽
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Monte os participantes, o orçamento e o elenco disponível antes de iniciar.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Participantes */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Participantes ({config.participants.length})
          </h2>
          <div className="mt-3 flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
              placeholder="Nome do participante"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleAddParticipant}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 active:scale-[0.98] transition"
            >
              Adicionar
            </button>
          </div>

          {config.participants.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nenhum participante cadastrado ainda.</p>
          ) : (
            <ul className="mt-4 space-y-1.5">
              {config.participants.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-300">
                      {i + 1}
                    </span>
                    {p.name}
                  </span>
                  <button
                    onClick={() => removeParticipant(p.id)}
                    className="text-slate-500 hover:text-red-400 transition text-xs font-medium"
                  >
                    remover
                  </button>
                </li>
              ))}
            </ul>
          )}
          {config.participants.length === 1 && (
            <p className="mt-3 text-xs text-amber-400">Adicione pelo menos mais 1 participante.</p>
          )}
        </section>

        {/* Orçamento */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Orçamento inicial
          </h2>
          <p className="mt-1 text-xs text-slate-500">Mesmo valor para todos os participantes.</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={config.budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-sm text-slate-400">pts</span>
          </div>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tabela de preços
          </h3>
          <ul className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 text-xs text-slate-400">
            {[90, 87, 84, 80, 76, 72, 68, 64, 0].map((min, idx, arr) => {
              const max = idx === 0 ? 99 : arr[idx - 1] - 1
              const label = idx === 0 ? `${min}+` : idx === arr.length - 1 ? `≤${max}` : `${min}–${max}`
              return (
                <li key={min} className="flex justify-between gap-1">
                  <span>{label}</span>
                  <span className="text-slate-300 font-medium">{priceForOverall(min === 0 ? 0 : min)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* Jogadores */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Jogadores disponíveis ({config.players.length})
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Cole uma lista no formato <code className="text-slate-400">Nome, Overall</code> — uma linha por jogador.
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={'Lionel Messi, 90\nKylian Mbappé, 91\nEderson, 86'}
          rows={5}
          className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={handleParseBulk}
            disabled={!bulkText.trim()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 active:scale-[0.98] transition disabled:opacity-40 disabled:hover:bg-emerald-500"
          >
            Adicionar jogadores
          </button>
          {config.players.length > 0 && (
            <button
              onClick={() => setPlayers([])}
              className="text-xs font-medium text-slate-500 hover:text-red-400 transition"
            >
              limpar lista
            </button>
          )}
        </div>

        {parseErrors.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-800/60 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
            <p className="font-semibold">Algumas linhas não foram reconhecidas:</p>
            <ul className="mt-1 space-y-0.5">
              {parseErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {config.players.length > 0 && (
          <>
            <input
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              placeholder="Buscar jogador..."
              className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-2 font-medium">Nome</th>
                    <th className="px-3 py-2 font-medium">Overall</th>
                    <th className="px-3 py-2 font-medium">Preço</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredPlayers.map((p) => (
                    <tr key={p.id} className="text-slate-200">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2 text-slate-400">{p.overall}</td>
                      <td className="px-3 py-2 font-medium text-emerald-400">{formatPts(p.price)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removePlayer(p.id)}
                          className="text-xs font-medium text-slate-500 hover:text-red-400 transition"
                        >
                          remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="mt-8 flex flex-col items-center gap-2">
        <button
          onClick={startDraft}
          disabled={!canStart}
          className="w-full sm:w-auto rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition disabled:opacity-30 disabled:shadow-none disabled:hover:bg-emerald-500"
        >
          Iniciar Draft
        </button>
        {!canStart && (
          <p className="text-xs text-slate-500">
            Precisa de pelo menos 2 participantes e 1 jogador disponível.
          </p>
        )}
      </div>
    </div>
  )
}
