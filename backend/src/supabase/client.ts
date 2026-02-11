import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'


const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client for backend operations (service role - bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
