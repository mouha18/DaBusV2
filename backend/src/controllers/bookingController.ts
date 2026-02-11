import { Response } from 'express'
import { supabaseAdmin } from '../supabase/client'
import { AuthRequest, CreateBookingRequest } from '../types'
import 'dotenv/config';

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*, trips:trips(*)')
      .eq('trip_id', req.user.userId)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.json({ success: true, data: bookings })
  } catch (error) {
    console.error('GetMyBookings error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { trip_id, full_name, phone } = req.body as CreateBookingRequest

    if (!trip_id || !full_name || !phone) {
      res.status(400).json({ success: false, error: 'Trip ID, name and phone are required' })
      return
    }

    // Check if trip exists and has available seats
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', trip_id)
      .single()

    if (tripError || !trip) {
      res.status(404).json({ success: false, error: 'Trip not found' })
      return
    }

    if (trip.available_seats <= 0) {
      res.status(400).json({ success: false, error: 'No available seats' })
      return
    }

    // Create pending booking with customer info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        trip_id,
        status: 'pending',
        payment_status: 'pending',
        full_name,
        phone
      })
      .select()
      .single()

    if (bookingError) {
      res.status(500).json({ success: false, error: bookingError.message })
      return
    }

    // Get Wave link based on price
    const waveLink2500 = process.env.WAVE_LINK_2500 || ''
    const waveLink3000 = process.env.WAVE_LINK_3000 || ''
    
    // Select Wave link based on trip price
    const waveLink = trip.price === 2500 ? waveLink2500 : waveLink3000

    // Update booking with wave payment link
    await supabaseAdmin
      .from('bookings')
      .update({ payment_link: waveLink })
      .eq('id', booking.id)

    res.status(201).json({
      success: true,
      data: {
        booking,
        payment: {
          checkout_url: waveLink
        }
      }
    })
  } catch (error) {
    console.error('CreateBooking error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !booking) {
      res.status(404).json({ success: false, error: 'Booking not found' })
      return
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ success: false, error: 'Booking already cancelled' })
      return
    }

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      res.status(500).json({ success: false, error: updateError.message })
      return
    }

    // Restore available seats on trip
    await supabaseAdmin
      .rpc('increment_available_seats', { trip_id: booking.trip_id, amount: 1 })

    res.json({ success: true, data: updatedBooking, message: 'Booking cancelled successfully' })
  } catch (error) {
    console.error('CancelBooking error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, trips:trips(*)')
      .eq('id', id)
      .single()

    if (error || !booking) {
      res.status(404).json({ success: false, error: 'Booking not found' })
      return
    }

    res.json({ success: true, data: booking })
  } catch (error) {
    console.error('GetBookingById error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
