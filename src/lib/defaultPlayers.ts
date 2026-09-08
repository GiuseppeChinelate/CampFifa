import defaultPlayersText from '../data/default-players.txt?raw'
import { parsePlayersBulkText } from './parsePlayers'
import type { Player } from '../types'

/**
 * Elenco padrão do sistema (jogadores ouro FC26/FC27, curados manualmente —
 * ver src/data/default-players.txt). Usado para popular a lista de jogadores
 * disponíveis assim que um novo draft é configurado.
 */
export function getDefaultPlayers(): Player[] {
  return parsePlayersBulkText(defaultPlayersText)
    .filter((r) => r.player)
    .map((r) => r.player!)
}
