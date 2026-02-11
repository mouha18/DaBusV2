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

  try {
    // Get total trips
    const { count: totalTrips } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })

    // Get total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Get total revenue (confirmed bookings)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('payment_status', 'paid')

    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0

    // Get upcoming trips
    const { count: upcomingTrips } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('departure_date', new Date().toISOString().split('T')[0])

    return res.json({
      success: true,
      data: {
        totalTrips: totalTrips || 0,
        totalBookings: totalBookings || 0,
        totalRevenue,
        upcomingTrips: upcomingTrips || 0
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

function getUserIdFromToken(token: string): string | null {
  if (token.startsWith('token-')) {
    return token.replace('token-', '')
  }
  return token
}
