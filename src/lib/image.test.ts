import { describe, expect, it } from 'vitest'
import { centreSquare } from './image'

describe('centreSquare', () => {
  it('crops the middle of landscape and portrait photos', () => {
    expect(centreSquare(400, 200)).toEqual({ x: 100, y: 0, side: 200 })
    expect(centreSquare(300, 900)).toEqual({ x: 0, y: 300, side: 300 })
    expect(centreSquare(50, 50)).toEqual({ x: 0, y: 0, side: 50 })
  })
})
