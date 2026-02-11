import { Response } from 'express'
import { supabaseAdmin } from '../../supabase/client'
import { AuthRequest, CreateTripRequest, Trip } from '../types'

export const getTrips = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { origin, destination, date, status } = req.query

    let query = supabaseAdmin
      .from('trips')
      .select('*')
      .order('departure_date', { ascending: true })

    if (origin) {
      query = query.ilike('origin', `%${origin}%`)
    }
    if (destination) {
      query = query.ilike('destination', `%${destination}%`)
    }
    if (date) {
      query = query.eq('departure_date', date)
    }
    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.in('status', ['scheduled', 'full'])
    }

    const { data: trips, error } = await query

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.json({ success: true, data: trips })
  } catch (error) {
    console.error('GetTrips error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const getTripById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !trip) {
      res.status(404).json({ success: false, error: 'Trip not found' })
      return
    }

    res.json({ success: true, data: trip })
  } catch (error) {
    console.error('GetTripById error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const createTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const { origin, destination, departure_date, departure_time, capacity, price } = 
      req.body as CreateTripRequest

    if (!origin || !destination || !departure_date || !departure_time || !capacity || !price) {
      res.status(400).json({ success: false, error: 'All fields are required' })
      return
    }

    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .insert({
        origin,
        destination,
        departure_date,
        departure_time,
        capacity,
        available_seats: capacity,
        price,
        status: 'scheduled',
        created_by: req.user.userId
      })
      .select()
      .single()

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.status(201).json({ success: true, data: trip })
  } catch (error) {
    console.error('CreateTrip error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const updateTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: trip, error } = await supabaseAdmin
      .from('trips')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.json({ success: true, data: trip })
  } catch (error) {
    console.error('UpdateTrip error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const deleteTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ success: false, error: error.message })
      return
    }

    res.json({ success: true, message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('DeleteTrip error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
