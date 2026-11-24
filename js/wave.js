export function waveArtTax(side, opponent, attacking, passive) {
  return attacking && side && !side.waveAttacked && passive(opponent).gravityKing ? 2 : 0
}

export function recordWaveArt(side, opponent, art, passive, maxEnergy, note) {
  if (['strike', 'blast', 'guard'].includes(art)) side.waveBasic = art
  if (side.wavePrevious === art && !side.waveRead) {
    const detective = opponent.team.find(f => !f.ko && passive(f).detective)
    if (detective) {
      side.waveRead = true
      opponent.ki = Math.min(maxEnergy, opponent.ki + 1)
      opponent.waveBrief = true
      note(detective, 'PATTERN RECOGNITION · +1 ENERGY')
    }
  }
  side.wavePrevious = art
}
