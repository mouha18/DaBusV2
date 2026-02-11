// Script to promote user to admin
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promoteAdmin() {
  const userId = process.argv[2]

  if (!userId) {
    console.log('Usage: npx tsx scripts/promote-admin.ts <userId>')
    process.exit(1)
  }

  const { error } = await supabase
    .from('users')
    .update({ role: 'admin', updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('✅ User promoted to admin!')
}

promoteAdmin()
