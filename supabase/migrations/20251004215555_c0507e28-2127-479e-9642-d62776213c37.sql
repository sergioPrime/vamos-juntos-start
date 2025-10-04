-- Add pessoa_id and whatsapp fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pessoa_id uuid,
ADD COLUMN IF NOT EXISTS whatsapp text;

-- Add foreign key to pessoas table
ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_pessoa
FOREIGN KEY (pessoa_id) 
REFERENCES public.pessoas(id)
ON DELETE SET NULL;