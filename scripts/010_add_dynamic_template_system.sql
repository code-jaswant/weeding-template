-- Dynamic HTML Template System
-- Adds support for placeholder-based templates with dynamic form generation

-- Add version column to templates table
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create template_fields table for field schema
CREATE TABLE IF NOT EXISTS public.template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text', -- text|textarea|number|date|email|phone|select|checkbox
  required BOOLEAN NOT NULL DEFAULT FALSE,
  options JSONB, -- for select/checkbox: ["A","B"] or [{"value":"A","label":"Alpha"}]
  default_value TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  help TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(template_id, field_id)
);

-- Create submissions table for user-filled values
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  template_version INTEGER NOT NULL DEFAULT 1, -- Store version at time of submission
  data JSONB NOT NULL, -- {"field_id": "value"}
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on new tables
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_fields_template_id ON public.template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_order_index ON public.template_fields(template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_submissions_template_id ON public.submissions(template_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_by ON public.submissions(created_by);

-- RLS Policies for template_fields
-- Admins can manage fields for any template
CREATE POLICY "Admins can manage all template fields" ON public.template_fields
  FOR ALL USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- Template owners can manage their own template fields
CREATE POLICY "Template owners can manage their fields" ON public.template_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id AND t.created_by = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id AND t.created_by = auth.uid()
    )
  );

-- Anyone can view fields for active templates (needed for form generation)
CREATE POLICY "Anyone can view fields for active templates" ON public.template_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_id AND t.active = true
    )
  );

-- RLS Policies for submissions
-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create submissions (for authenticated users)
CREATE POLICY "Users can create submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions" ON public.submissions
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Allow anonymous submissions (optional - remove if you want only authenticated users)
-- CREATE POLICY "Anyone can create submissions" ON public.submissions
--   FOR INSERT WITH CHECK (true);

-- Add comment for clarity
COMMENT ON TABLE public.template_fields IS 'Field schema extracted from template placeholders ({{field_id}})';
COMMENT ON TABLE public.submissions IS 'User-filled values for template instances';
COMMENT ON COLUMN public.templates.version IS 'Template version number, incremented on structural changes';

