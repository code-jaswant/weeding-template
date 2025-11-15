-- Add html_content column to templates table
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS html_content TEXT;

-- Comment for clarity
COMMENT ON COLUMN public.templates.html_content IS 'HTML code for template preview and download';
