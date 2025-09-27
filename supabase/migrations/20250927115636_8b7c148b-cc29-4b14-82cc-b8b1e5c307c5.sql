-- Create table for appointment types
CREATE TABLE public.appointment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment types
CREATE POLICY "Users can manage appointment types from their organization" 
ON public.appointment_types 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create table for appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  responsible TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  is_task BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  customer_id UUID NULL, -- References customers table if exists
  opportunity TEXT NULL, -- Free text for now
  appointment_type_id UUID NULL REFERENCES public.appointment_types(id),
  remind_responsible BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can manage appointments from their organization" 
ON public.appointments 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create trigger for updated_at on appointment_types
CREATE TRIGGER update_appointment_types_updated_at
BEFORE UPDATE ON public.appointment_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on appointments
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();