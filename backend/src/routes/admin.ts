import { Router, Request, Response } from 'express'
import { authenticate, authorize } from '../middlewares/auth'
import { supabaseAdmin } from '../../supabase/client'
import { AuthRequest } from '../types'
import { excelService } from '../services/excelService'

const router = Router()

// Promote user to admin (requires secret - no auth required)
router.post('/promote-user', async (req: Request, res: Response) => {
  try {
    const { secret, userId } = req.body
    const expectedSecret = process.env.ADMIN_PROMOTE_SECRET

    if (secret !== expectedSecret) {
      res.status(401).json({ success: false, error: 'Invalid secret' })
      return
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.json({ success: true, message: 'User promoted to admin' })
  } catch (error) {
    console.error('Promote error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// All admin routes require authentication and admin role
router.use(authenticate)
router.use(authorize(['admin']))

// Dashboard statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: totalTrips } = await supabaseAdmin
      .from('trips')
      .select('*', { count: 'exact', head: true })

    const { count: totalBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    const { count: completedBookings } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { data: recentBookings } = await supabaseAdmin
      .from('bookings')
      .select('*, trips:trips(*)')
      .order('created_at', { ascending: false })
      .limit(10)

    res.json({
      success: true,
      data: { totalUsers, totalTrips, totalBookings, completedBookings, recentBookings }
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// All bookings (admin view)
router.get('/bookings', async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const from = (Number(page) - 1) * Number(limit)
    const to = from + Number(limit) - 1

    let query = supabaseAdmin
      .from('bookings')
      .select('*, trips:trips(*)', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.json({
      success: true,
      data: bookings,
      pagination: { page: Number(page), limit: Number(limit), total: count }
    })
  } catch (error) {
    console.error('Admin bookings error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Update booking status
router.post('/bookings/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' })
      return
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    if (status === 'cancelled') {
      await supabaseAdmin.rpc('increment_available_seats', { trip_id: booking.trip_id, amount: 1 })
    }

    if (status === 'confirmed') {
      await supabaseAdmin.rpc('decrement_available_seats', { trip_id: booking.trip_id, amount: 1 })
    }

    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('Update booking status error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// All trips (admin view)
router.get('/trips', async (req: AuthRequest, res) => {
  try {
    const { data: trips, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .order('departure_date', { ascending: true })

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.json({ success: true, data: trips })
  } catch (error) {
    console.error('Admin trips error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Export trips to Excel
router.get('/export/trips', async (req: AuthRequest, res) => {
  try {
    const { data: trips, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .order('departure_date', { ascending: true })

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    await excelService.exportTrips(res, trips || [])
  } catch (error) {
    console.error('Export trips error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Export bookings to Excel
router.get('/export/bookings', async (req: AuthRequest, res) => {
  try {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, trips:trips(*)')
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    await excelService.exportBookings(res, bookings || [])
  } catch (error) {
    console.error('Export bookings error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Export full report (trips + bookings) to Excel
router.get('/export/report', async (req: AuthRequest, res) => {
  try {
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .order('departure_date', { ascending: true })

    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*, trips:trips(*)')
      .order('created_at', { ascending: false })

    if (tripsError) {
      res.status(500).json({ success: false, error: tripsError.message })
      return
    }

    if (bookingsError) {
      res.status(500).json({ success: false, error: bookingsError.message })
      return
    }

    await excelService.exportFullReport(res, trips || [], bookings || [])
  } catch (error) {
    console.error('Export report error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
