import type { FormationId, Position } from '../types'

export const POSITION_LABELS: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LD: 'Lateral-Direito',
  LE: 'Lateral-Esquerdo',
  VOL: 'Volante',
  MC: 'Meio-Campista',
  MEI: 'Meia Ofensivo',
  MD: 'Meia-Direita',
  ME: 'Meia-Esquerda',
  PD: 'Ponta-Direita',
  PE: 'Ponta-Esquerda',
  SA: 'Segundo Atacante',
  ATA: 'Atacante',
}

/** Coordenada percentual no campo (0-100). `top` 0 = ataque, 100 = perto do próprio gol. */
export type SlotCoord = { left: number; top: number }

export type FormationSlot = { position: Position; coords: SlotCoord[] }

export type Formation = {
  id: FormationId
  label: string
  slots: FormationSlot[]
}

export const FORMATIONS: Record<FormationId, Formation> = {
  '4-4-2': {
    id: '4-4-2',
    label: '4-4-2',
    slots: [
      { position: 'GOL', coords: [{ left: 50, top: 92 }] },
      { position: 'LD', coords: [{ left: 84, top: 74 }] },
      { position: 'ZAG', coords: [{ left: 63, top: 76 }, { left: 37, top: 76 }] },
      { position: 'LE', coords: [{ left: 16, top: 74 }] },
      { position: 'MD', coords: [{ left: 84, top: 50 }] },
      { position: 'MC', coords: [{ left: 63, top: 54 }, { left: 37, top: 54 }] },
      { position: 'ME', coords: [{ left: 16, top: 50 }] },
      { position: 'ATA', coords: [{ left: 62, top: 18 }, { left: 38, top: 18 }] },
    ],
  },
  '4-3-3': {
    id: '4-3-3',
    label: '4-3-3',
    slots: [
      { position: 'GOL', coords: [{ left: 50, top: 92 }] },
      { position: 'LD', coords: [{ left: 84, top: 74 }] },
      { position: 'ZAG', coords: [{ left: 63, top: 76 }, { left: 37, top: 76 }] },
      { position: 'LE', coords: [{ left: 16, top: 74 }] },
      { position: 'VOL', coords: [{ left: 50, top: 58 }] },
      { position: 'MC', coords: [{ left: 68, top: 46 }, { left: 32, top: 46 }] },
      { position: 'PD', coords: [{ left: 85, top: 20 }] },
      { position: 'ATA', coords: [{ left: 50, top: 14 }] },
      { position: 'PE', coords: [{ left: 15, top: 20 }] },
    ],
  },
  '4-2-3-1': {
    id: '4-2-3-1',
    label: '4-2-3-1',
    slots: [
      { position: 'GOL', coords: [{ left: 50, top: 92 }] },
      { position: 'LD', coords: [{ left: 84, top: 74 }] },
      { position: 'ZAG', coords: [{ left: 63, top: 76 }, { left: 37, top: 76 }] },
      { position: 'LE', coords: [{ left: 16, top: 74 }] },
      { position: 'VOL', coords: [{ left: 63, top: 58 }, { left: 37, top: 58 }] },
      { position: 'MD', coords: [{ left: 82, top: 36 }] },
      { position: 'MEI', coords: [{ left: 50, top: 40 }] },
      { position: 'ME', coords: [{ left: 18, top: 36 }] },
      { position: 'ATA', coords: [{ left: 50, top: 14 }] },
    ],
  },
  '3-5-2': {
    id: '3-5-2',
    label: '3-5-2',
    slots: [
      { position: 'GOL', coords: [{ left: 50, top: 92 }] },
      { position: 'ZAG', coords: [{ left: 75, top: 76 }, { left: 50, top: 78 }, { left: 25, top: 76 }] },
      { position: 'MD', coords: [{ left: 86, top: 48 }] },
      { position: 'VOL', coords: [{ left: 63, top: 56 }, { left: 37, top: 56 }] },
      { position: 'MC', coords: [{ left: 50, top: 44 }] },
      { position: 'ME', coords: [{ left: 14, top: 48 }] },
      { position: 'ATA', coords: [{ left: 62, top: 18 }, { left: 38, top: 18 }] },
    ],
  },
  '3-4-3': {
    id: '3-4-3',
    label: '3-4-3',
    slots: [
      { position: 'GOL', coords: [{ left: 50, top: 92 }] },
      { position: 'ZAG', coords: [{ left: 75, top: 76 }, { left: 50, top: 78 }, { left: 25, top: 76 }] },
      { position: 'MD', coords: [{ left: 86, top: 52 }] },
      { position: 'MC', coords: [{ left: 63, top: 50 }, { left: 37, top: 50 }] },
      { position: 'ME', coords: [{ left: 14, top: 52 }] },
      { position: 'PD', coords: [{ left: 84, top: 20 }] },
      { position: 'ATA', coords: [{ left: 50, top: 14 }] },
      { position: 'PE', coords: [{ left: 16, top: 20 }] },
    ],
  },
  '5-3-2': {
    id: '5-3-2',
    label: '5-3-2',
    slots: [
      { position: 'GOL', coords: [{ left: 50, top: 92 }] },
      { position: 'LD', coords: [{ left: 90, top: 68 }] },
      { position: 'ZAG', coords: [{ left: 70, top: 76 }, { left: 50, top: 78 }, { left: 30, top: 76 }] },
      { position: 'LE', coords: [{ left: 10, top: 68 }] },
      { position: 'MC', coords: [{ left: 70, top: 48 }, { left: 50, top: 44 }, { left: 30, top: 48 }] },
      { position: 'ATA', coords: [{ left: 62, top: 18 }, { left: 38, top: 18 }] },
    ],
  },
}

export const FORMATION_IDS: FormationId[] = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2']

/** Aceita variações comuns (PT/EN, sigla de jogo) e devolve o código canônico da posição. */
const POSITION_ALIASES: Record<string, Position> = {
  GOL: 'GOL', GK: 'GOL', GOLEIRO: 'GOL',
  ZAG: 'ZAG', CB: 'ZAG', ZAGUEIRO: 'ZAG',
  LD: 'LD', RB: 'LD', LATERALDIREITO: 'LD',
  LE: 'LE', LB: 'LE', LATERALESQUERDO: 'LE',
  VOL: 'VOL', CDM: 'VOL', VOLANTE: 'VOL',
  MC: 'MC', CM: 'MC', MEIOCAMPISTA: 'MC', MEIOCAMPO: 'MC',
  MEI: 'MEI', CAM: 'MEI', MEIAOFENSIVO: 'MEI', MEIOATACANTE: 'MEI',
  MD: 'MD', RM: 'MD', MEIADIREITA: 'MD',
  ME: 'ME', LM: 'ME', MEIAESQUERDA: 'ME',
  PD: 'PD', RW: 'PD', PONTADIREITA: 'PD',
  PE: 'PE', LW: 'PE', PONTAESQUERDA: 'PE',
  SA: 'SA', CF: 'SA', SEGUNDOATACANTE: 'SA',
  ATA: 'ATA', ST: 'ATA', ATACANTE: 'ATA',
}

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g')

export function normalizePosition(raw: string): Position | null {
  const key = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^A-Z]/g, '')
  return POSITION_ALIASES[key] ?? null
}
