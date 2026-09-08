import type { Player } from '../types'

export type SortKey = 'price-desc' | 'price-asc' | 'overall-desc' | 'overall-asc' | 'name-asc'

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'price-desc', label: 'Preço (maior → menor)' },
  { value: 'price-asc', label: 'Preço (menor → maior)' },
  { value: 'overall-desc', label: 'Overall (maior → menor)' },
  { value: 'overall-asc', label: 'Overall (menor → maior)' },
  { value: 'name-asc', label: 'Nome (A → Z)' },
]

export function sortPlayers(players: Player[], sort: SortKey): Player[] {
  const list = [...players]
  switch (sort) {
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price)
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price)
    case 'overall-desc':
      return list.sort((a, b) => b.overall - a.overall)
    case 'overall-asc':
      return list.sort((a, b) => a.overall - b.overall)
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name))
  }
}
