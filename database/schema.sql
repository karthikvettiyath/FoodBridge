-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  user_id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text unique not null,
  password text not null, -- Hashed password
  role text check (role in ('DONOR', 'NGO', 'VOLUNTEER', 'ADMIN')) not null,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Donors Table
create table donors (
  donor_id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(user_id) on delete cascade not null,
  address text,
  unique(user_id)
);

-- NGOs Table
create table ngos (
  ngo_id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(user_id) on delete cascade not null,
  organization_name text not null,
  address text,
  latitude decimal(10, 7),
  longitude decimal(10, 7),
  unique(user_id)
);

-- Volunteers Table
create table volunteers (
  volunteer_id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(user_id) on delete cascade not null,
  ngo_id uuid references ngos(ngo_id) on delete set null,
  availability text check (availability in ('AVAILABLE', 'BUSY')) default 'AVAILABLE',
  unique(user_id)
);

-- Donations Table
create table donations (
  donation_id uuid default uuid_generate_v4() primary key,
  donor_id uuid references donors(donor_id) on delete cascade not null,
  food_name text not null,
  food_type text check (food_type in ('VEG', 'NON_VEG')) not null,
  quantity text,
  prepared_time timestamp with time zone,
  expiry_time timestamp with time zone,
  latitude decimal(10, 7),
  longitude decimal(10, 7),
  status text check (status in ('PENDING', 'ACCEPTED', 'PICKED', 'DELIVERED')) default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pickups Table
create table pickups (
  pickup_id uuid default uuid_generate_v4() primary key,
  donation_id uuid references donations(donation_id) on delete cascade not null,
  volunteer_id uuid references volunteers(volunteer_id) on delete cascade not null,
  pickup_time timestamp with time zone,
  delivery_time timestamp with time zone,
  status text check (status in ('ASSIGNED', 'PICKED', 'DELIVERED')) default 'ASSIGNED'
);

-- Notifications Table
create table notifications (
  notification_id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(user_id) on delete cascade not null,
  message text not null,
  type text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
