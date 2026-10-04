import express from 'express'
import { activeGrants } from '../billing/grants.js'
import { loadUser, requireCsrf, requireUser } from '../auth/middleware.js'
import { publicUser } from '../auth/routes.js'

/** The logged-in user's dashboard data. Mounted at /api/account. */
export function accountRouter({ db, now }) {
  const router = express.Router()
  router.use(requireCsrf)
  router.use(loadUser({ db, now }))
  router.use(requireUser)

  router.get('/', async (req, res) => {
    const packs = await activeGrants(db, req.user.id, now())
    res.json({
      user: publicUser(req.user),
      minutesLeft: packs.reduce((sum, p) => sum + p.minutesLeft, 0),
      packs: packs.map((p) => ({ id: p.id, planName: p.planName, minutesTotal: p.minutesTotal, minutesLeft: p.minutesLeft, endsAt: p.endsAt }))
    })
  })

  return router
}
