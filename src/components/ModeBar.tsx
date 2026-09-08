import { MODE_INFO, type DraftMode } from '../lib/modes'

type ModeBarProps = {
  mode: DraftMode
  onHome: () => void
}

export function ModeBar({ mode, onHome }: ModeBarProps) {
  const info = MODE_INFO[mode]
  return (
    <div className="mb-4 flex items-center justify-between">
      <button
        onClick={onHome}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-300 transition"
      >
        ← Início
      </button>
      <span className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
        <span>{info.emoji}</span>
        {info.label}
      </span>
    </div>
  )
}
