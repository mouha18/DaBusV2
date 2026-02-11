import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

function getUserIdFromToken(token: string): string | null {
  // In production, verify JWT token with Supabase
  // For now, we extract user ID from token format: token-{userId}
  if (token.startsWith('token-')) {
    return token.replace('token-', '')
  }
  return token // Assume it's the actual user ID
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = extractToken(req.headers.authorization)
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const userId = getUserIdFromToken(token)
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }

  if (req.method === 'GET') {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips:trips (
            id,
            origin,
            destination,
            departure_date,
            departure_time,
            price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get bookings error:', error)
        return res.status(500).json({ success: false, error: error.message })
      }

      return res.json({
        success: true,
        data: bookings || []
      })
    } catch (error) {
      console.error('Get bookings error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    const { trip_id, seats, passenger_info } = req.body

    if (!trip_id || !seats || !passenger_info) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    try {
      // Get trip details
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', trip_id)
        .single()

      if (tripError || !trip) {
        return res.status(404).json({ success: false, error: 'Trip not found' })
      }

      // Calculate total price
      const total_price = seats * trip.price

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          trip_id,
          seats,
          total_price,
          status: 'pending',
          payment_status: 'pending',
          full_name: passenger_info.full_name,
          phone: passenger_info.phone
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Create booking error:', bookingError)
        return res.status(500).json({ success: false, error: bookingError.message })
      }

      return res.status(201).json({
        success: true,
        data: booking
      })
    } catch (error) {
      console.error('Create booking error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
