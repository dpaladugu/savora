-- Create user_llm_configurations table
CREATE TABLE public.user_llm_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider_id text,
  encrypted_config text,
  base_url text,
  model_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_llm_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_llm_configurations
CREATE POLICY "Users can view their own llm configurations" ON public.user_llm_configurations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own llm configurations" ON public.user_llm_configurations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own llm configurations" ON public.user_llm_configurations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own llm configurations" ON public.user_llm_configurations
  FOR DELETE USING (auth.uid() = user_id);
