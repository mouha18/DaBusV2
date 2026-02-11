import { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' })
  }

  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return res.status(401).json({ success: false, error: authError.message })
    }

    // Get user profile from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('User profile error:', userError)
    }

    const user = userData || {
      id: authData.user.id,
      email: authData.user.email,
      full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0],
      role: 'user',
      phone: authData.user.user_metadata?.phone || ''
    }

    // Create session token (in production, use JWT)
    const token = authData.session?.access_token || `token-${authData.user.id}`

    return res.json({
      success: true,
      data: {
        user,
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
