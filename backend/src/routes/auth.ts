import { Router } from 'express'
import { body } from 'express-validator'
import { login, getMe } from '../controllers/authController'
import { authenticate } from '../middlewares/auth'

const router = Router()

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login)

// Get current user
router.get('/me', authenticate, getMe)

export default router
