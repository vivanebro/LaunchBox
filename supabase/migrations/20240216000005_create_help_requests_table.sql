-- Create HelpRequest table
CREATE TABLE IF NOT EXISTS public.help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_by UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_help_requests_created_by ON public.help_requests(created_by);
CREATE INDEX idx_help_requests_created_date ON public.help_requests(created_date DESC);
CREATE INDEX idx_help_requests_status ON public.help_requests(status);

-- Enable Row Level Security
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own help requests
CREATE POLICY "Users can read their own help requests"
    ON public.help_requests
    FOR SELECT
    USING (created_by::text = auth.uid()::text);

-- Create policy for users to create their own help requests
CREATE POLICY "Users can create help requests"
    ON public.help_requests
    FOR INSERT
    WITH CHECK (created_by::text = auth.uid()::text OR created_by IS NULL);

-- Create policy for admins to read all help requests
CREATE POLICY "Admins can read all help requests"
    ON public.help_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Create policy for admins to update help requests
CREATE POLICY "Admins can update help requests"
    ON public.help_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Create policy for service role to manage help requests
CREATE POLICY "Service role can manage help requests"
    ON public.help_requests
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create trigger for updated_date
CREATE TRIGGER update_help_requests_updated_date
    BEFORE UPDATE ON public.help_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

-- Grant permissions
GRANT SELECT, INSERT ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;

-- Create a function to get new help requests count
CREATE OR REPLACE FUNCTION get_new_help_requests_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.help_requests
        WHERE status = 'new'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
