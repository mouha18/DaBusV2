import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .order('departure_date', { ascending: true })
      .eq('status', 'scheduled')

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    // Calculate available seats for each trip
    const processedTrips = trips?.map(trip => ({
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      departure_date: trip.departure_date,
      departure_time: trip.departure_time,
      capacity: trip.capacity,
      available_seats: trip.capacity - (trip.booked_seats || 0),
      price: trip.price,
      status: trip.status
    })) || []

    return res.json({
      success: true,
      data: processedTrips
    })
  } catch (error) {
    console.error('Get trips error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
