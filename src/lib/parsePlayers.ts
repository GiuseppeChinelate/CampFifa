import { priceForOverall } from './pricing'
import { normalizePosition } from './formations'
import type { Player } from '../types'

export type ParsedPlayerLine = {
  raw: string
  player?: Player
  error?: string
}

let idCounter = 0
function nextId() {
  idCounter += 1
  return `p${Date.now().toString(36)}${idCounter}`
}

/**
 * Aceita colagem em massa no formato "Nome, Overall, Posição" (uma linha por jogador).
 * Posição aceita siglas em PT ou EN (GOL/GK, ZAG/CB, LE/LB, ATA/ST etc — ver lib/formations.ts).
 */
export function parsePlayersBulkText(text: string): ParsedPlayerLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  return lines.map((raw) => {
    const parts = raw.split(',').map((p) => p.trim())
    if (parts.length < 3) {
      return { raw, error: 'Formato esperado: Nome, Overall, Posição' }
    }

    const position = normalizePosition(parts[parts.length - 1])
    const overallStr = parts[parts.length - 2]
    const name = parts.slice(0, parts.length - 2).join(', ').trim()
    const overall = Number(overallStr)

    if (!name) {
      return { raw, error: 'Nome vazio' }
    }
    if (!Number.isFinite(overall) || overall <= 0 || overall > 99) {
      return { raw, error: 'Overall inválido' }
    }
    if (!position) {
      return { raw, error: `Posição "${parts[parts.length - 1]}" não reconhecida` }
    }

    return {
      raw,
      player: {
        id: nextId(),
        name,
        overall: Math.round(overall),
        price: priceForOverall(Math.round(overall)),
        position,
      },
    }
  })
}

/**
 * Aceita um JSON com um array de objetos jogador (como o gerado por
 * scripts/fetch-futbin-players.mjs): cada item precisa de nome (`name`/`playerName`),
 * overall (`overall`/`rating`) e posição (`position`/`pos`).
 */
export function parsePlayersJsonText(text: string): ParsedPlayerLine[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return [{ raw: text.slice(0, 80), error: 'JSON inválido' }]
  }

  if (!Array.isArray(data)) {
    return [{ raw: text.slice(0, 80), error: 'Esperado um array de jogadores' }]
  }

  return data.map((item, i) => {
    const raw = JSON.stringify(item)
    if (typeof item !== 'object' || item === null) {
      return { raw, error: `Item ${i} não é um objeto` }
    }
    const record = item as Record<string, unknown>
    const name = record.name ?? record.playerName
    const overallRaw = record.overall ?? record.rating
    const overall = Number(overallRaw)
    const positionRaw = record.position ?? record.pos

    if (typeof name !== 'string' || !name.trim()) {
      return { raw, error: 'Nome ausente' }
    }
    if (!Number.isFinite(overall) || overall <= 0 || overall > 99) {
      return { raw, error: 'Overall inválido' }
    }
    const position = typeof positionRaw === 'string' ? normalizePosition(positionRaw) : null
    if (!position) {
      return { raw, error: `Posição "${String(positionRaw ?? '')}" não reconhecida` }
    }

    return {
      raw,
      player: {
        id: nextId(),
        name: name.trim(),
        overall: Math.round(overall),
        price: priceForOverall(Math.round(overall)),
        position,
      },
    }
  })
}
