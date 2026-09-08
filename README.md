# CampFifa Draft

Web app de draft de elenco para campeonatos de FIFA entre amigos. Cada participante monta seu elenco de jogadores individuais dentro de um orçamento fixo, em vez de escolher times inteiros — resolvendo o desbalanceamento entre seleções.

## Regras

- **Preço por overall**: 90+ → 500 · 87–89 → 380 · 84–86 → 280 · 80–83 → 200 · 76–79 → 140 · 72–75 → 95 · 68–71 → 60 · 64–67 → 35 · ≤63 → 15 (ajustável em [src/lib/pricing.ts](src/lib/pricing.ts))
- **Draft sequencial em ordem snake** (1→2→3→…→N→…→3→2→1→…), com preço fixo — sem lances
- Participante sem saldo para o jogador comprável (dentro das posições que ainda precisa) mais barato é pulado automaticamente
- **Formação por participante**: no início do primeiro turno de cada um, escolhe a formação (4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 3-4-3 ou 5-3-2 — ver [src/lib/formations.ts](src/lib/formations.ts)). Enquanto o time titular não está completo, só dá pra comprar jogadores das posições em aberto; depois de completo, dá pra reforçar o banco livremente, sem restrição de posição — até **5 reservas** (`MAX_BENCH` em [src/lib/draftEngine.ts](src/lib/draftEngine.ts)), mesmo que sobre saldo
- Draft termina quando ninguém mais pode comprar, ou manualmente
- **Chaveamento**: tela própria, aberta pelo botão "Ir para o chaveamento" na tela de resultado. Sorteia um mata-mata com os nomes dos participantes ([src/lib/bracket.ts](src/lib/bracket.ts)) — ajusta sozinho pra qualquer quantidade, só a 1ª rodada pode ficar ímpar (quem sobra folga e avança direto sem jogar), as rodadas seguintes sempre fecham em pares. Clicar no vencedor de cada confronto avança ele pro próximo, em cascata até sair um campeão

## Rodando localmente

```bash
npm install
npm run dev
```

Aplicação 100% client-side (sem backend) — o estado do draft fica salvo no `localStorage` do navegador.

## Importando jogadores do Futbin

A tela de configuração aceita colar `Nome, Overall, Posição` manualmente (posição em sigla PT ou EN — ex: ZAG/CB, LE/LB, ATA/ST, ver `normalizePosition` em [src/lib/formations.ts](src/lib/formations.ts)), mas também dá pra popular a lista inteira a partir do Futbin usando o ator [`getdataforme/futbin-category-details`](https://apify.com/getdataforme/futbin-category-details) do Apify.

Isso roda como um script Node **local** (não dentro do app) porque exige um token pago do Apify, que nunca deve ficar exposto no navegador.

```bash
# dry-run: mostra o que seria feito, sem gastar créditos
node scripts/fetch-futbin-players.mjs --url https://www.futbin.com/players

# execução de verdade (cobra ~$9 a cada 1.000 jogadores retornados)
APIFY_TOKEN=seu_token node scripts/fetch-futbin-players.mjs \
  --url https://www.futbin.com/players --yes
```

Isso gera `data/futbin-players.txt` (formato `Nome, Overall, Posição`, pronto pra colar) e `data/futbin-players.json`. Na tela de configuração, use o botão **"Importar arquivo"** ao lado de "Adicionar jogadores" para carregar qualquer um dos dois diretamente. Itens sem posição reconhecida pelo Futbin são descartados.

## Lista padrão

Toda configuração nova já vem com 239 jogadores ouro (FC26/FC27, curados manualmente — [src/data/default-players.txt](src/data/default-players.txt)) prontos pra draftar, sem precisar importar nada. Se uma sessão salva antiga estiver com a lista vazia, o botão **"Carregar lista padrão"** na tela de configuração recarrega esses jogadores sem mexer nos participantes já cadastrados.

Flags do script: `--token`, `--max` (maxRequestsPerCrawl), `--out` (caminho base de saída), `--no-proxy`, `--yes`. Rode `node scripts/fetch-futbin-players.mjs --help` para ver tudo.
