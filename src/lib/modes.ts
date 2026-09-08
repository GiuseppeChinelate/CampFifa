export type DraftMode = 'normal' | 'cirrose'

export const MODES: DraftMode[] = ['normal', 'cirrose']

export const MODE_INFO: Record<DraftMode, { label: string; emoji: string; tagline: string }> = {
  normal: {
    label: 'Modo Normal',
    emoji: '⚽',
    tagline: 'O draft de sempre, sem regra extra nenhuma.',
  },
  cirrose: {
    label: 'Copa Cirrose',
    emoji: '🍺',
    tagline: 'Mesmas regras de draft, campeonato à parte.',
  },
}
