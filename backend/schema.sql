-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  daily_calorie_target int default 2000,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Food Logs (The core data)
create table food_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  raw_input text, -- What the user typed/said
  image_url text, -- Optional photo
  parsed_content jsonb, -- structured data from LLM (food items, quantities)
  macros jsonb, -- {calories, protein, carbs, fat}
  mood_rating int, -- 1-10
  mood_tags text[], -- ['stressed', 'bored', 'hungry']
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Summaries (Aggregated by AI or triggers)
create table daily_summaries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  total_macros jsonb,
  ai_analysis text, -- "You ate more sugar today because..."
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Notifications
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  type text not null, -- 'reminder', 'intervention', 'summary'
  message text not null,
  status text default 'pending', -- 'pending', 'sent', 'failed'
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic security)
alter table profiles enable row level security;
alter table food_logs enable row level security;
alter table daily_summaries enable row level security;
alter table notifications enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own logs" on food_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on food_logs for insert with check (auth.uid() = user_id);

create policy "Users can view own summaries" on daily_summaries for select using (auth.uid() = user_id);
