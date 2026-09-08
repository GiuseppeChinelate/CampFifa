import { useMemo, useRef, useState } from 'react'
import type { SetupConfig } from '../store/useDraftStore'
import { parsePlayersBulkText, parsePlayersJsonText, type ParsedPlayerLine } from '../lib/parsePlayers'
import { getDefaultPlayers } from '../lib/defaultPlayers'
import { formatPts } from '../lib/format'
import { priceForOverall } from '../lib/pricing'
import type { BracketType } from '../lib/bracket'
import type { DraftMode } from '../lib/modes'
import { ModeBar } from './ModeBar'

type SetupScreenProps = {
  mode: DraftMode
  onHome: () => void
  config: SetupConfig
  addParticipant: (name: string) => void
  removeParticipant: (id: string) => void
  setBudget: (budget: number) => void
  setBracketType: (bracketType: BracketType) => void
  setPlayers: (players: SetupConfig['players']) => void
  removePlayer: (id: string) => void
  startDraft: () => void
}

export function SetupScreen({
  mode,
  onHome,
  config,
  addParticipant,
  removeParticipant,
  setBudget,
  setBracketType,
  setPlayers,
  removePlayer,
  startDraft,
}: SetupScreenProps) {
  const [nameInput, setNameInput] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [playerFilter, setPlayerFilter] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canStart = config.participants.length >= 2 && config.players.length >= 1

  function handleAddParticipant() {
    if (!nameInput.trim()) return
    addParticipant(nameInput)
    setNameInput('')
  }

  function ingestResults(results: ParsedPlayerLine[]) {
    const newPlayers = results.filter((r) => r.player).map((r) => r.player!)
    const errors = results.filter((r) => r.error).map((r) => `"${r.raw}" — ${r.error}`)

    const existingNames = new Set(config.players.map((p) => p.name.toLowerCase()))
    const deduped = newPlayers.filter((p) => !existingNames.has(p.name.toLowerCase()))

    setPlayers([...config.players, ...deduped])
    setParseErrors(errors)
  }

  function handleParseBulk() {
    if (!bulkText.trim()) return
    ingestResults(parsePlayersBulkText(bulkText))
    setBulkText('')
  }

  function handleLoadDefaults() {
    const defaults = getDefaultPlayers()
    ingestResults(defaults.map((p) => ({ raw: `${p.name}, ${p.overall}`, player: p })))
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError(null)
    try {
      const text = await file.text()
      const isJson = file.name.toLowerCase().endsWith('.json')
      ingestResults(isJson ? parsePlayersJsonText(text) : parsePlayersBulkText(text))
    } catch {
      setImportError('Não foi possível ler o arquivo.')
    }
  }

  const filteredPlayers = useMemo(() => {
    const q = playerFilter.trim().toLowerCase()
    if (!q) return config.players
    return config.players.filter((p) => p.name.toLowerCase().includes(q))
  }, [config.players, playerFilter])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <ModeBar mode={mode} onHome={onHome} />
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

        {/* Chaveamento */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Chaveamento</h2>
          <p className="mt-1 text-xs text-slate-500">Como o mata-mata depois do draft vai funcionar.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setBracketType('single')}
              className={`rounded-xl border p-4 text-left transition ${
                config.bracketType === 'single'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
              }`}
            >
              <span className={`text-sm font-bold ${config.bracketType === 'single' ? 'text-emerald-400' : 'text-slate-100'}`}>
                Tradicional
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Eliminação simples — perdeu, tá fora. Quem sobrar ímpar numa rodada folga e avança direto.
              </p>
            </button>
            <button
              onClick={() => setBracketType('double')}
              className={`rounded-xl border p-4 text-left transition ${
                config.bracketType === 'double'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
              }`}
            >
              <span className={`text-sm font-bold ${config.bracketType === 'double' ? 'text-emerald-400' : 'text-slate-100'}`}>
                Duplo (chave superior/inferior)
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Só sai depois de perder duas vezes. Quem perde na chave superior cai pra chave inferior e continua vivo.
              </p>
            </button>
          </div>
        </section>
      </div>

      {/* Jogadores */}
      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Jogadores disponíveis ({config.players.length})
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Cole uma lista no formato <code className="text-slate-400">Nome, Overall, Posição</code> — uma linha por jogador
          (posição aceita siglas em PT ou EN, ex: ZAG/CB, LE/LB, ATA/ST), ou
          importe um arquivo <code className="text-slate-400">.txt</code>/<code className="text-slate-400">.json</code> gerado
          por <code className="text-slate-400">npm run fetch:futbin</code>.
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={'Lionel Messi, 90, ATA\nKylian Mbappé, 91, PE\nEderson, 86, GOL'}
          rows={5}
          className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            onClick={handleParseBulk}
            disabled={!bulkText.trim()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 active:scale-[0.98] transition disabled:opacity-40 disabled:hover:bg-emerald-500"
          >
            Adicionar jogadores
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-750 active:scale-[0.98] transition"
          >
            Importar arquivo
          </button>
          <input ref={fileInputRef} type="file" accept=".txt,.json" onChange={handleFileImport} className="hidden" />
          <button
            onClick={handleLoadDefaults}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-750 active:scale-[0.98] transition"
          >
            Carregar lista padrão
          </button>
          {config.players.length > 0 && (
            <button
              onClick={() => setPlayers([])}
              className="ml-auto text-xs font-medium text-slate-500 hover:text-red-400 transition"
            >
              limpar lista
            </button>
          )}
        </div>

        {importError && <p className="mt-2 text-xs text-red-400">{importError}</p>}

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
                    <th className="px-3 py-2 font-medium">Pos</th>
                    <th className="px-3 py-2 font-medium">Overall</th>
                    <th className="px-3 py-2 font-medium">Preço</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredPlayers.map((p) => (
                    <tr key={p.id} className="text-slate-200">
                      <td className="px-3 py-2">{p.name}</td>
                      <td className="px-3 py-2 text-slate-400">{p.position}</td>
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
