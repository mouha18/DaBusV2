import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../supabase/client'
import { AuthRequest, RegisterRequest, LoginRequest, User } from '../types'
import { generateToken } from '../middlewares/auth'

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, phone } = req.body as RegisterRequest

    // Validate required fields
    if (!email || !password || !full_name || !phone) {
      res.status(400).json({ success: false, error: 'All fields are required' })
      return
    }

    // Check if user profile already exists by email
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role')
      .eq('email', email)
      .single()

    if (existingProfile) {
      // User already registered, generate token and return success
      const token = generateToken({
        userId: existingProfile.id,
        email: existingProfile.email,
        role: existingProfile.role
      })

      res.status(201).json({
        success: true,
        data: {
          user: existingProfile,
          token
        }
      })
      return
    }

    // Create user in Supabase Auth first
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      res.status(500).json({ success: false, error: 'Failed to create user' })
      return
    }

    // Check if profile already exists for this auth ID (from previous failed attempts)
    const { data: profileExists } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role')
      .eq('id', authData.user.id)
      .single()

    if (profileExists) {
      // Profile already exists, return success
      const token = generateToken({
        userId: profileExists.id,
        email: profileExists.email,
        role: profileExists.role
      })

      res.status(201).json({
        success: true,
        data: {
          user: profileExists,
          token
        }
      })
      return
    }

    // Create user profile in 'users' table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        phone,
        role: 'student'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Cleanup auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      res.status(500).json({ success: false, error: 'Failed to create user profile' })
      return
    }

    // Generate JWT
    const token = generateToken({
      userId: authData.user.id,
      email,
      role: 'student'
    })

    res.status(201).json({
      success: true,
      data: {
        user: { id: authData.user.id, email, full_name, phone, role: 'student' },
        token
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' })
      return
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    // Get user profile
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      res.status(500).json({ success: false, error: 'User not found' })
      return
    }

    // Generate JWT
    const token = generateToken({
      userId: authData.user.id,
      email: userData.email,
      role: userData.role
    })

    res.json({
      success: true,
      data: {
        user: userData,
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single()

    if (error || !userData) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    res.json({ success: true, data: userData })
  } catch (error) {
    console.error('GetMe error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
