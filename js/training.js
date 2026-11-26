export const LV_MAX = 100
export const lvNeed = level => 40 + level * 8
const TICKET_XP = 400
const COINS_PER_XP = 8

export function trainingQuote(card, target, payment, availableTickets = 0) {
  const level = card.lv || 1
  if (!Number.isInteger(target) || target <= level || target > LV_MAX) return null
  let xp = -(card.xp || 0)
  for (let next = level; next < target; next++) xp += lvNeed(next)
  xp = Math.max(0, xp)

  if (payment === 'coins') return { xp, coins: xp * COINS_PER_XP, tickets: 0, unusedXP: 0 }
  if (payment === 'tickets') {
    const tickets = Math.ceil(xp / TICKET_XP)
    return { xp, coins: 0, tickets, unusedXP: tickets * TICKET_XP - xp }
  }
  if (payment === 'mixed') {
    const tickets = Math.min(availableTickets, Math.floor(xp / TICKET_XP))
    return { xp, coins: (xp - tickets * TICKET_XP) * COINS_PER_XP, tickets, unusedXP: 0 }
  }
  return null
}
