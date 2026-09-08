import { FORMATIONS, FORMATION_IDS, POSITION_LABELS } from '../lib/formations'
import type { FormationId } from '../types'

type FormationPickerProps = {
  participantName: string
  onChoose: (formation: FormationId) => void
}

export function FormationPicker({ participantName, onChoose }: FormationPickerProps) {
  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5">
      <h2 className="text-lg font-bold text-slate-50">Escolha a formação de {participantName}</h2>
      <p className="mt-1 text-sm text-slate-400">
        Define as posições do time titular. Depois de completo, dá pra comprar reservas de qualquer posição.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {FORMATION_IDS.map((id) => {
          const formation = FORMATIONS[id]
          return (
            <button
              key={id}
              onClick={() => onChoose(id)}
              className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-left transition hover:border-emerald-500/60 hover:bg-slate-800 active:scale-[0.98]"
            >
              <span className="text-xl font-bold text-slate-50">{formation.label}</span>
              <p className="mt-1.5 text-xs text-slate-500">
                {formation.slots.map((s) => `${s.coords.length}× ${POSITION_LABELS[s.position]}`).join(' · ')}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
