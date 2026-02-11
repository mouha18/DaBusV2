// Database types for Supabase
// These types match the expected database schema

export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'student' | 'admin'
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  origin: string
  destination: string
  departure_date: string
  departure_time: string
  capacity: number
  available_seats: number
  price: number
  status: 'scheduled' | 'full' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  trip_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_id?: string
  payment_link?: string
  full_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  booking_id: string
  amount: number
  method: 'wave' | 'orange_money'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  naboo_transaction_id?: string
  created_at: string
  updated_at: string
}

// API Request/Response types
export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  phone: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CreateTripRequest {
  origin: string
  destination: string
  departure_date: string
  departure_time: string
  capacity: number
  price: number
}

export interface CreateBookingRequest {
  trip_id: string
  full_name: string
  phone: string
}

export interface JWTPayload {
  userId: string
  email: string
  role: 'student' | 'admin'
  iat?: number
  exp?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
