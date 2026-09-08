# CampFifa Draft

Web app de draft de elenco para campeonatos de FIFA entre amigos. Cada participante monta seu elenco de jogadores individuais dentro de um orçamento fixo, em vez de escolher times inteiros — resolvendo o desbalanceamento entre seleções.

## Regras

- **Preço por overall**: 90+ → 500 · 87–89 → 380 · 84–86 → 280 · 80–83 → 200 · 76–79 → 140 · 72–75 → 95 · 68–71 → 60 · 64–67 → 35 · ≤63 → 15 (ajustável em [src/lib/pricing.ts](src/lib/pricing.ts))
- **Draft sequencial em ordem snake** (1→2→3→…→N→…→3→2→1→…), com preço fixo — sem lances
- Participante sem saldo para o jogador mais barato disponível é pulado automaticamente
- Sem restrição de posição ou tamanho de elenco
- Draft termina quando ninguém mais pode comprar, ou manualmente

## Rodando localmente

```bash
npm install
npm run dev
```

Aplicação 100% client-side (sem backend) — o estado do draft fica salvo no `localStorage` do navegador.
