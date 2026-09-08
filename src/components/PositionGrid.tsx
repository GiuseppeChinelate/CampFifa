import { formatPts } from '../lib/format'
import type { Formation } from '../lib/formations'
import type { Player, Position } from '../types'

type PositionGridProps = {
  formation: Formation
  roster: Player[]
  onSlotClick: (position: Position) => void
}

type Disc = { key: string; position: Position; left: number; top: number; player?: Player }

export function PositionGrid({ formation, roster, onSlotClick }: PositionGridProps) {
  const ownedByPosition = new Map<Position, Player[]>()
  for (const p of roster) {
    const list = ownedByPosition.get(p.position) ?? []
    list.push(p)
    ownedByPosition.set(p.position, list)
  }

  const discs: Disc[] = []
  for (const slot of formation.slots) {
    const filled = ownedByPosition.get(slot.position) ?? []
    slot.coords.forEach((coord, i) => {
      discs.push({
        key: `${slot.position}-${i}`,
        position: slot.position,
        left: coord.left,
        top: coord.top,
        player: filled[i],
      })
    })
  }

  return (
    <div
      className="pitch relative w-full overflow-hidden rounded-2xl border border-emerald-900/60 bg-gradient-to-b from-emerald-800/50 via-emerald-950/60 to-emerald-950"
      style={{ aspectRatio: '3 / 4' }}
    >
      <svg
        className="pitch-markings pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 300 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line x1="0" y1="200" x2="300" y2="200" />
        <circle cx="150" cy="200" r="46" />
        <circle cx="150" cy="200" r="2.4" className="mk-fill" />
        <path d="M62 0 V60 H238 V0" />
        <path d="M112 0 V22 H188 V0" />
        <circle cx="150" cy="40" r="2.4" className="mk-fill" />
        <path d="M110.8 60 A44 44 0 0 0 189.2 60" />
        <path d="M62 400 V340 H238 V400" />
        <path d="M112 400 V378 H188 V400" />
        <circle cx="150" cy="360" r="2.4" className="mk-fill" />
        <path d="M110.8 340 A44 44 0 0 1 189.2 340" />
        <path d="M0 9 A9 9 0 0 0 9 0" />
        <path d="M291 0 A9 9 0 0 0 300 9" />
        <path d="M300 391 A9 9 0 0 0 291 400" />
        <path d="M9 400 A9 9 0 0 0 0 391" />
      </svg>

      {discs.map((d) => (
        <div
          key={d.key}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${d.left}%`, top: `${d.top}%` }}
        >
          {d.player ? (
            <div className="flex w-[4.25rem] flex-col items-center gap-0.5 rounded-lg border border-emerald-400/70 bg-emerald-500/25 px-1.5 py-1.5 text-center shadow-lg backdrop-blur-sm sm:w-20">
              <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-200">{d.position}</span>
              <span className="w-full truncate text-[10px] font-semibold text-white">{d.player.name}</span>
              <span className="text-[9px] text-emerald-100/80">
                {d.player.overall} · {formatPts(d.player.price)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onSlotClick(d.position)}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white/50 bg-black/25 shadow transition hover:border-emerald-300 hover:bg-emerald-500/30 active:scale-95 sm:h-14 sm:w-14"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">{d.position}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
