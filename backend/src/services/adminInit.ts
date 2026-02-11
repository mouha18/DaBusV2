// Admin User Initialization Service
// Creates an admin user on server startup if it doesn't exist

import { supabaseAdmin } from '../../supabase/client'

interface AdminConfig {
  email: string
  password: string
  fullName: string
  phone: string
}

const getAdminConfig = (): AdminConfig | null => {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const fullName = process.env.ADMIN_FULL_NAME
  const phone = process.env.ADMIN_PHONE

  if (!email || !password || !fullName || !phone) {
    console.log('⚠️  Admin credentials not configured in .env')
    return null
  }

  return { email, password, fullName, phone }
}

export const initializeAdminUser = async (): Promise<void> => {
  const config = getAdminConfig()
  if (!config) return

  try {
    console.log(`🔐 Checking for admin user: ${config.email}`)

    // Check if user already exists in users table
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', config.email)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error checking admin user:', userError)
      return
    }

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('✅ Admin user already exists')
      } else {
        // Upgrade to admin
        await supabaseAdmin
          .from('users')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', existingUser.id)
        console.log('⬆️  User upgraded to admin')
      }
      return
    }

    // Check if user exists in auth
    const { data: authUser } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUser?.users.find(u => u.email === config.email)

    if (existingAuthUser) {
      // User exists in auth but not in public.users - create profile
      await supabaseAdmin
        .from('users')
        .insert({
          id: existingAuthUser.id,
          email: config.email,
          full_name: config.fullName,
          phone: config.phone,
          role: 'admin'
        })
      console.log('✅ Admin profile created')
      return
    }

    // Create new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: {
        full_name: config.fullName,
        phone: config.phone
      }
    })

    if (createError) {
      console.error('❌ Failed to create admin user:', createError)
      return
    }

    // Create admin profile
    if (newUser?.user) {
      // Insert with ignore to avoid trigger conflict, then update role
      await supabaseAdmin
        .from('users')
        .insert({
          id: newUser.user.id,
          email: config.email,
          full_name: config.fullName,
          phone: config.phone,
          role: 'admin'
        })
      
      // Force update to admin role (in case trigger overwrote)
      await supabaseAdmin
        .from('users')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', newUser.user.id)
      
      console.log('✅ Admin user created successfully')
    }
  } catch (error) {
    console.error('❌ Admin initialization error:', error)
  }
}
