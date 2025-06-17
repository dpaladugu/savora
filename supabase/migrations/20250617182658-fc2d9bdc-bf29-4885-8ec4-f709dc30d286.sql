
-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'income')),
  payment_method text,
  tags text,
  account text,
  source text DEFAULT 'manual',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create investments table
CREATE TABLE public.investments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  amount decimal(12,2) NOT NULL,
  units decimal(12,4),
  price decimal(12,2),
  current_value decimal(12,2),
  purchase_date date NOT NULL,
  maturity_date date,
  expected_return decimal(5,2),
  actual_return decimal(5,2),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  source text DEFAULT 'manual',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for investments
CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments" ON public.investments
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
