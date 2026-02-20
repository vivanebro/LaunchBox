-- Create AccessCode table
CREATE TABLE IF NOT EXISTS public.access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'unused',
    generation_source TEXT,
    created_by UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE UNIQUE INDEX idx_access_codes_code ON public.access_codes(code);

-- Create index on status for filtering
CREATE INDEX idx_access_codes_status ON public.access_codes(status);

-- Enable Row Level Security
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read access codes
CREATE POLICY "Authenticated users can read access codes"
    ON public.access_codes
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy for admins to manage access codes
CREATE POLICY "Admins can manage access codes"
    ON public.access_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Create policy for service role to manage access codes
CREATE POLICY "Service role can manage access codes"
    ON public.access_codes
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create trigger for updated_date
CREATE TRIGGER update_access_codes_updated_date
    BEFORE UPDATE ON public.access_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

-- Grant permissions
GRANT SELECT ON public.access_codes TO authenticated;
GRANT ALL ON public.access_codes TO service_role;
