import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query, method } = req
  const id = query.id as string

  if (method === 'GET') {
    if (!id) {
      return res.status(400).json({ success: false, error: 'Trip ID is required' })
    }

    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !trip) {
        return res.status(404).json({ success: false, error: 'Trip not found' })
      }

      const processedTrip = {
        id: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        departure_date: trip.departure_date,
        departure_time: trip.departure_time,
        capacity: trip.capacity,
        available_seats: trip.capacity - (trip.booked_seats || 0),
        price: trip.price,
        status: trip.status,
        description: trip.description || ''
      }

      return res.json({
        success: true,
        data: processedTrip
      })
    } catch (error) {
      console.error('Get trip error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
