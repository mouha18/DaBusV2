import { Router } from 'express'
import { body } from 'express-validator'
import { getTrips, getTripById, createTrip, updateTrip, deleteTrip } from '../controllers/tripController'
import { authenticate, authorize } from '../middlewares/auth'

const router = Router()

// Public routes - all users can view trips
router.get('/', getTrips)
router.get('/:id', getTripById)

// Admin only routes
router.post('/', authenticate, authorize(['admin']), [
  body('origin').trim().notEmpty(),
  body('destination').trim().notEmpty(),
  body('departure_date').isDate(),
  body('departure_time').trim().notEmpty(),
  body('capacity').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 })
], createTrip)

router.put('/:id', authenticate, authorize(['admin']), updateTrip)
router.delete('/:id', authenticate, authorize(['admin']), deleteTrip)

export default router
