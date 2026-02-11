-- Users table
create table users (
  id uuid primary key references auth.users(id),
  email text unique not null,
  full_name text not null,
  phone text not null,
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trips table
create table trips (
  id uuid default gen_random_uuid() primary key,
  origin text not null,
  destination text not null,
  departure_date date not null,
  departure_time text not null,
  capacity int not null,
  available_seats int not null,
  price decimal not null,
  status text default 'scheduled' check (status in ('scheduled', 'full', 'completed', 'cancelled')),
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bookings table
create table bookings (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id),
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  payment_id text,
  full_name text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on all tables
-- RLS Policies for bookings
-- Admins can view all bookings
create policy "Admins can view all bookings" on bookings
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

-- Anyone can create bookings (public booking)
create policy "Anyone can create bookings" on bookings
  for insert with check (true);

-- Admins can update any booking
create policy "Admins can update bookings" on bookings
  for update using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

-- Database Functions
-- Increment available seats
create or replace function increment_available_seats(trip_id uuid, amount int)
returns void as $$
begin
  update trips
  set available_seats = available_seats + amount,
      updated_at = now()
  where id = trip_id;
end;
$$ language plpgsql;

-- Decrement available seats
create or replace function decrement_available_seats(trip_id uuid, amount int)
returns void as $$
begin
  update trips
  set available_seats = available_seats - amount,
      updated_at = now()
  where id = trip_id;
end;
$$ language plpgsql;

-- Trigger to create user profile on auth.users creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'student'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert a test admin user (run this after creating an auth user manually in Supabase dashboard)
-- update users set role = 'admin' where email = 'admin@example.com';

-- Enable Realtime for bookings (optional)
-- alter publication supabase_realtime add table bookings;