-- Create HealthReport table
CREATE TABLE IF NOT EXISTS public.health_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date TIMESTAMPTZ NOT NULL,
    total_packages INTEGER DEFAULT 0,
    auto_fixed INTEGER DEFAULT 0,
    needs_attention INTEGER DEFAULT 0,
    fixes JSONB DEFAULT '[]'::jsonb,
    issues JSONB DEFAULT '[]'::jsonb,
    report_text TEXT,
    status TEXT DEFAULT 'all_clear',
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_health_reports_report_date ON public.health_reports(report_date DESC);
CREATE INDEX idx_health_reports_status ON public.health_reports(status);
CREATE INDEX idx_health_reports_created_date ON public.health_reports(created_date DESC);

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_health_reports_fixes ON public.health_reports USING GIN(fixes);
CREATE INDEX idx_health_reports_issues ON public.health_reports USING GIN(issues);

-- Enable Row Level Security
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read all health reports
CREATE POLICY "Admins can read all health reports"
    ON public.health_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Create policy for service role to manage health reports
CREATE POLICY "Service role can manage health reports"
    ON public.health_reports
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create trigger for updated_date
CREATE TRIGGER update_health_reports_updated_date
    BEFORE UPDATE ON public.health_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

-- Grant permissions
GRANT SELECT ON public.health_reports TO authenticated;
GRANT ALL ON public.health_reports TO service_role;

-- Create a function to get the latest health report
CREATE OR REPLACE FUNCTION get_latest_health_report()
RETURNS TABLE (
    id UUID,
    report_date TIMESTAMPTZ,
    total_packages INTEGER,
    auto_fixed INTEGER,
    needs_attention INTEGER,
    fixes JSONB,
    issues JSONB,
    report_text TEXT,
    status TEXT,
    created_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hr.id,
        hr.report_date,
        hr.total_packages,
        hr.auto_fixed,
        hr.needs_attention,
        hr.fixes,
        hr.issues,
        hr.report_text,
        hr.status,
        hr.created_date
    FROM public.health_reports hr
    ORDER BY hr.created_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
