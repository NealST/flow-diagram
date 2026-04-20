import { describe, expect, it } from 'vitest'
import { getRouter } from './router'

describe('getRouter', () => {
  it('includes the scaffolded routes', () => {
    const router = getRouter()
    const childPaths = (router.options.routeTree.children ?? []).map(
      (route) => route.fullPath,
    )

    expect(childPaths).toEqual(expect.arrayContaining(['/', '/about']))
  })
})
