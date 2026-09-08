import { useMemo } from 'react'
import { MODES, MODE_INFO, type DraftMode } from '../lib/modes'
import { peekModeSummary } from '../store/useDraftStore'
import { getCurrentParticipantId } from '../lib/draftEngine'

type HomeScreenProps = {
  onSelect: (mode: DraftMode) => void
}

function statusFor(mode: DraftMode): { text: string; tone: 'idle' | 'live' | 'done' } {
  const summary = peekModeSummary(mode)
  if (!summary || (!summary.draft && summary.config.participants.length === 0 && summary.config.players.length === 0)) {
    return { text: 'Ainda não configurado', tone: 'idle' }
  }
  if (!summary.draft) {
    const { participants, players } = summary.config
    return {
      text: `Configurado — ${participants.length} participante${participants.length !== 1 ? 's' : ''}, ${players.length} jogador${players.length !== 1 ? 'es' : ''}`,
      tone: 'idle',
    }
  }
  if (summary.draft.phase === 'live') {
    const currentId = getCurrentParticipantId(summary.draft)
    const currentName = summary.draft.participants.find((p) => p.id === currentId)?.name
    return { text: currentName ? `Draft em andamento — vez de ${currentName}` : 'Draft em andamento', tone: 'live' }
  }
  return { text: `Draft finalizado — ${summary.draft.participants.length} participantes`, tone: 'done' }
}

export function HomeScreen({ onSelect }: HomeScreenProps) {
  const statuses = useMemo(() => Object.fromEntries(MODES.map((m) => [m, statusFor(m)])) as Record<DraftMode, ReturnType<typeof statusFor>>, [])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-50">CampFifa Draft ⚽</h1>
        <p className="mt-2 text-sm text-slate-400">Escolha o campeonato para configurar ou continuar.</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {MODES.map((mode) => {
          const info = MODE_INFO[mode]
          const status = statuses[mode]
          return (
            <button
              key={mode}
              onClick={() => onSelect(mode)}
              className="group flex flex-col items-start rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left transition hover:border-emerald-500/60 hover:bg-slate-900 active:scale-[0.98]"
            >
              <span className="text-4xl">{info.emoji}</span>
              <h2 className="mt-3 text-xl font-bold text-slate-50">{info.label}</h2>
              <p className="mt-1 text-sm text-slate-500">{info.tagline}</p>
              <span
                className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  status.tone === 'live'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : status.tone === 'done'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                }`}
              >
                {status.tone === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {status.text}
              </span>
              <span className="mt-4 text-sm font-semibold text-emerald-400 opacity-0 transition group-hover:opacity-100">
                Entrar →
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
