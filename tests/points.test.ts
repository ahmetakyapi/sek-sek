import { describe, expect, it } from 'vitest'
import { POINTS, runPoints } from '../lib/points'

describe('puan', () => {
  it('altın sürede düşmeden üç hatıra: 1000 + 750 + 150', () => {
    expect(runPoints(100, 100000, 0, 3)).toEqual({ time: 1000, items: 750, deaths: -0, clean: 150, total: 1900 })
  })
  it('her hatıra 250 puan: hızlı ama hatırasız koşu, biraz yavaş ve hatıralı koşunun gerisinde', () => {
    expect(runPoints(100, 80000, 0, 0).total).toBeLessThan(runPoints(100, 120000, 0, 3).total)
  })
  it('süre payı sınırlı, düşüş cezası en çok 300, puan eksiye düşmez', () => {
    expect(runPoints(100, 1000, 0, 0).time).toBe(POINTS.time * POINTS.maxTime)
    expect(runPoints(100, 10_000_000, 0, 0).time).toBe(POINTS.time * POINTS.minTime)
    expect(runPoints(100, 100000, 500, 0).deaths).toBe(-POINTS.maxDeathLoss)
    expect(runPoints(100, 10_000_000, 500, 0).total).toBeGreaterThanOrEqual(0)
  })
})
