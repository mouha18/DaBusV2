// Webhooks for DaBus
// Payment confirmations are handled manually by admin through the dashboard

import { Router, Request, Response } from 'express'

const router = Router()

// Placeholder for future webhook integrations
router.post('/wave', async (req: Request, res: Response) => {
  // Wave webhooks can be added here if needed
  res.json({ received: true, message: 'Wave webhook endpoint - not yet configured' })
})

export default router
