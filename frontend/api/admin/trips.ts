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

async function checkAdminRole(userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  return user?.role === 'admin'
}

function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('token-')) {
    return token.replace('token-', '')
  }
  return token
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

  // Check admin role
  const isAdmin = await checkAdminRole(userId)
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'Admin access required' })
  }

  if (req.method === 'GET') {
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .order('departure_date', { ascending: false })

      if (error) {
        return res.status(500).json({ success: false, error: error.message })
      }

      return res.json({
        success: true,
        data: trips || []
      })
    } catch (error) {
      console.error('Get admin trips error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    const { origin, destination, departure_date, departure_time, capacity, price } = req.body

    if (!origin || !destination || !departure_date || !departure_time || !capacity || !price) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          origin,
          destination,
          departure_date,
          departure_time,
          capacity: parseInt(capacity),
          price: parseInt(price),
          booked_seats: 0,
          status: 'scheduled'
        })
        .select()
        .single()

      if (error) {
        return res.status(500).json({ success: false, error: error.message })
      }

      return res.status(201).json({
        success: true,
        data: trip
      })
    } catch (error) {
      console.error('Create trip error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
