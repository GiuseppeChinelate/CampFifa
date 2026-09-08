import { useState } from 'react'
import type { DraftState } from '../types'
import type { Bracket } from '../lib/bracket'
import { ModeBar } from './ModeBar'
import { BracketView } from './BracketView'
import { ConfirmModal } from './ConfirmModal'
import type { DraftMode } from '../lib/modes'

type BracketScreenProps = {
  mode: DraftMode
  onHome: () => void
  draft: DraftState
  bracket: Bracket | null
  generateBracket: () => void
  setMatchWinner: (matchId: string, winnerId: string) => void
  goToResults: () => void
}

export function BracketScreen({
  mode,
  onHome,
  draft,
  bracket,
  generateBracket,
  setMatchWinner,
  goToResults,
}: BracketScreenProps) {
  const [confirmReshuffle, setConfirmReshuffle] = useState(false)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <ModeBar mode={mode} onHome={onHome} />

      <button
        onClick={goToResults}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-300 transition"
      >
        ← Voltar ao elenco
      </button>

      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-50">Chaveamento 🎲</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {bracket
            ? 'Clique no nome do vencedor de cada confronto pra avançar ele.'
            : `Sorteia os confrontos com os ${draft.participants.length} participantes do draft — se sobrar alguém ímpar numa rodada, ele folga e avança direto.`}
        </p>
      </header>

      {bracket ? (
        <>
          <BracketView bracket={bracket} participants={draft.participants} onSetWinner={setMatchWinner} />
          <button
            onClick={() => setConfirmReshuffle(true)}
            className="mt-6 text-xs font-medium text-slate-500 hover:text-red-400 transition"
          >
            sortear de novo (embaralha tudo)
          </button>
        </>
      ) : (
        <button
          onClick={generateBracket}
          className="rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition"
        >
          Sortear chaveamento
        </button>
      )}

      {confirmReshuffle && (
        <ConfirmModal
          title="Sortear o chaveamento de novo?"
          description="Isso embaralha os confrontos do zero e apaga os resultados já marcados nesse chaveamento."
          confirmLabel="Sortear de novo"
          danger
          onConfirm={() => {
            setConfirmReshuffle(false)
            generateBracket()
          }}
          onCancel={() => setConfirmReshuffle(false)}
        />
      )}
    </div>
  )
}
