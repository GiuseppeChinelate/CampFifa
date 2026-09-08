import { priceForOverall } from './pricing'
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
 * Aceita colagem em massa no formato "Nome, Overall" (uma linha por jogador).
 * Tolera espaços extras e vírgulas dentro do nome (usa a última vírgula como separador).
 */
export function parsePlayersBulkText(text: string): ParsedPlayerLine[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  return lines.map((raw) => {
    const lastComma = raw.lastIndexOf(',')
    if (lastComma === -1) {
      return { raw, error: 'Formato esperado: Nome, Overall' }
    }
    const name = raw.slice(0, lastComma).trim()
    const overallStr = raw.slice(lastComma + 1).trim()
    const overall = Number(overallStr)

    if (!name) {
      return { raw, error: 'Nome vazio' }
    }
    if (!Number.isFinite(overall) || overall <= 0 || overall > 99) {
      return { raw, error: 'Overall inválido' }
    }

    return {
      raw,
      player: {
        id: nextId(),
        name,
        overall: Math.round(overall),
        price: priceForOverall(Math.round(overall)),
      },
    }
  })
}
