#!/usr/bin/env node
/**
 * Busca jogadores do Futbin via o ator Apify "getdataforme/futbin-category-details"
 * e gera uma lista pronta para colar na tela de configuração do draft (formato "Nome, Overall, Posição"),
 * além de um JSON equivalente para importação por arquivo. Itens sem posição reconhecida são descartados.
 *
 * Esse script roda localmente (Node), fora do app — o token do Apify é pago por resultado
 * e nunca deve ser exposto no navegador.
 *
 * Uso:
 *   APIFY_TOKEN=xxxx node scripts/fetch-futbin-players.mjs --url https://www.futbin.com/players --yes
 *   node scripts/fetch-futbin-players.mjs --token xxxx --url <categoria1> --url <categoria2> --out data/meu-elenco --yes
 *
 * Flags:
 *   --url <url>       URL de categoria/lista do Futbin a raspar (repetível). Obrigatório.
 *   --token <token>   API token do Apify. Também pode vir de APIFY_TOKEN no ambiente.
 *   --max <n>         maxRequestsPerCrawl do ator (padrão 100).
 *   --out <path>      Caminho base de saída, sem extensão (padrão "data/futbin-players").
 *   --no-proxy        Desliga o proxy residencial do Apify (mais barato, mais chance de bloqueio).
 *   --yes             Confirma a execução paga. Sem essa flag, o script só mostra o que faria.
 */
import { ApifyClient } from 'apify-client'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const ACTOR_ID = 'getdataforme/futbin-category-details'
const PRICE_PER_1000 = 9

// Mesmo mapeamento de src/lib/formations.ts (duplicado aqui pra este script
// rodar com `node` puro, sem precisar compilar TS).
const POSITION_ALIASES = {
  GOL: 'GOL', GK: 'GOL',
  ZAG: 'ZAG', CB: 'ZAG',
  LD: 'LD', RB: 'LD', RWB: 'LD',
  LE: 'LE', LB: 'LE', LWB: 'LE',
  VOL: 'VOL', CDM: 'VOL',
  MC: 'MC', CM: 'MC',
  MEI: 'MEI', CAM: 'MEI',
  MD: 'MD', RM: 'MD',
  ME: 'ME', LM: 'ME',
  PD: 'PD', RW: 'PD',
  PE: 'PE', LW: 'PE',
  SA: 'SA', CF: 'SA',
  ATA: 'ATA', ST: 'ATA',
}

function normalizePosition(raw) {
  if (!raw) return null
  const key = String(raw).trim().toUpperCase().replace(/[^A-Z]/g, '')
  return POSITION_ALIASES[key] ?? null
}

function parseArgs(argv) {
  const args = { urls: [], max: 100, out: 'data/futbin-players', proxy: true, yes: false, token: process.env.APIFY_TOKEN }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--url') args.urls.push(argv[++i])
    else if (a === '--token') args.token = argv[++i]
    else if (a === '--max') args.max = Number(argv[++i])
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--no-proxy') args.proxy = false
    else if (a === '--yes') args.yes = true
    else if (a === '--help' || a === '-h') args.help = true
    else {
      console.error(`Argumento desconhecido: ${a}`)
      process.exit(1)
    }
  }
  return args
}

function printHelp() {
  console.log(`
Busca jogadores do Futbin via Apify e gera arquivos para o draft.

Uso:
  APIFY_TOKEN=xxxx node scripts/fetch-futbin-players.mjs --url <url-do-futbin> --yes

Flags:
  --url <url>      URL de categoria/lista do Futbin (repetível). Obrigatório.
  --token <token>  API token do Apify (ou defina APIFY_TOKEN no ambiente).
  --max <n>        maxRequestsPerCrawl do ator (padrão 100).
  --out <path>     Caminho base de saída sem extensão (padrão data/futbin-players).
  --no-proxy       Desliga o proxy residencial (mais barato, mais chance de bloqueio pelo Futbin).
  --yes            Confirma a execução — o ator cobra $${PRICE_PER_1000.toFixed(2)} a cada 1.000 resultados.
`)
}

function extractPlayer(item) {
  const name = item.playerName ?? item.name ?? item.player_name
  const overallRaw = item.rating ?? item.overall ?? item.ovr ?? item.playerRating
  const overall = Number(overallRaw)
  const position = normalizePosition(item.position ?? item.pos)
  if (!name || !Number.isFinite(overall) || !position) return null
  return { name: String(name).trim(), overall: Math.round(overall), position }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) return printHelp()

  if (args.urls.length === 0) {
    console.error('Erro: passe pelo menos um --url apontando para uma página do Futbin.')
    printHelp()
    process.exit(1)
  }
  if (!args.token) {
    console.error('Erro: nenhum token do Apify informado. Use --token ou a variável de ambiente APIFY_TOKEN.')
    process.exit(1)
  }

  console.log(`Ator: ${ACTOR_ID}`)
  console.log(`URLs (${args.urls.length}):`)
  args.urls.forEach((u) => console.log(`  - ${u}`))
  console.log(`maxRequestsPerCrawl: ${args.max}`)
  console.log(`proxy residencial: ${args.proxy ? 'sim' : 'não'}`)
  console.log(`Custo estimado: $${PRICE_PER_1000.toFixed(2)} a cada 1.000 jogadores retornados (cobrado na sua conta Apify).`)

  if (!args.yes) {
    console.log('\nModo simulação (dry-run) — nada foi executado. Rode novamente com --yes para confirmar e gastar créditos do Apify.')
    return
  }

  const client = new ApifyClient({ token: args.token })
  const input = {
    startUrls: args.urls.map((url) => ({ url })),
    maxRequestsPerCrawl: args.max,
    ...(args.proxy ? { proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] } } : {}),
  }

  console.log('\nIniciando o run no Apify...')
  const run = await client.actor(ACTOR_ID).call(input)
  console.log(`Run finalizado: ${run.id} (status: ${run.status})`)

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  console.log(`Itens brutos retornados: ${items.length}`)

  const seen = new Map()
  let skipped = 0
  for (const item of items) {
    const player = extractPlayer(item)
    if (!player) {
      skipped++
      continue
    }
    const key = player.name.toLowerCase()
    const existing = seen.get(key)
    if (!existing || player.overall > existing.overall) {
      seen.set(key, player)
    }
  }

  const players = [...seen.values()].sort((a, b) => b.overall - a.overall)
  console.log(`Jogadores válidos: ${players.length} (ignorados por dados incompletos: ${skipped})`)

  const txtPath = `${args.out}.txt`
  const jsonPath = `${args.out}.json`
  await mkdir(dirname(txtPath), { recursive: true })

  const txtContent = players.map((p) => `${p.name}, ${p.overall}, ${p.position}`).join('\n') + '\n'
  await writeFile(txtPath, txtContent, 'utf-8')
  await writeFile(jsonPath, JSON.stringify(players, null, 2), 'utf-8')

  console.log(`\nGerado:`)
  console.log(`  ${txtPath}  (cole no campo "Jogadores disponíveis" da tela de configuração)`)
  console.log(`  ${jsonPath} (importável pelo botão "Importar arquivo" na mesma tela)`)
}

main().catch((err) => {
  console.error('\nFalhou:', err.message ?? err)
  process.exit(1)
})
