import { Router } from 'express'
import { body } from 'express-validator'
import { getMyBookings, createBooking, cancelBooking, getBookingById } from '../controllers/bookingController'
import { authenticate } from '../middlewares/auth'

const router = Router()

// Get user's bookings (requires auth)
router.get('/', authenticate, getMyBookings)

// Get single booking (requires auth)
router.get('/:id', authenticate, getBookingById)

// Create new booking (public)
router.post('/', [
  body('trip_id').notEmpty()
], createBooking)

// Cancel booking (requires auth)
router.post('/:id/cancel', authenticate, cancelBooking)

export default router
