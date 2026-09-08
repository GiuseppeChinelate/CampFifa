/**
 * Tabela de preço por faixa de overall. Ajuste os valores aqui para
 * recalibrar a economia do draft — nenhum outro lugar do app precisa mudar.
 * Ordenada da faixa mais alta para a mais baixa; `min` é inclusivo.
 */
const PRICE_TABLE: { min: number; price: number }[] = [
  { min: 90, price: 500 },
  { min: 87, price: 380 },
  { min: 84, price: 280 },
  { min: 80, price: 200 },
  { min: 76, price: 140 },
  { min: 72, price: 95 },
  { min: 68, price: 60 },
  { min: 64, price: 35 },
  { min: 0, price: 15 },
]

export function priceForOverall(overall: number): number {
  const tier = PRICE_TABLE.find((t) => overall >= t.min)
  return tier ? tier.price : PRICE_TABLE[PRICE_TABLE.length - 1].price
}
