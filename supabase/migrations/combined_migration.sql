-- =====================================================
-- COMBINED SUPABASE MIGRATION FILE
-- =====================================================
-- Run this file in Supabase SQL Editor to create all tables at once
-- Project: LaunchBox
-- Date: 2024-02-16
-- =====================================================

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid()::text = id::text OR role = 'admin');

CREATE POLICY "Admins can read all users"
    ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "Service role can manage users"
    ON public.users
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_date
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- =====================================================
-- 2. CREATE ACCESS CODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'unused',
    generation_source TEXT,
    created_by UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_access_codes_code ON public.access_codes(code);
CREATE INDEX idx_access_codes_status ON public.access_codes(status);

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read access codes"
    ON public.access_codes
    FOR SELECT
    TO authenticated
    USING (true);

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

CREATE POLICY "Service role can manage access codes"
    ON public.access_codes
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE TRIGGER update_access_codes_updated_date
    BEFORE UPDATE ON public.access_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

GRANT SELECT ON public.access_codes TO authenticated;
GRANT ALL ON public.access_codes TO service_role;

-- =====================================================
-- 3. CREATE PACKAGE CONFIGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.package_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_set_name TEXT,
    business_name TEXT,

    price_starter NUMERIC,
    price_growth NUMERIC,
    price_premium NUMERIC,
    price_elite NUMERIC,

    popular_package_index JSONB DEFAULT '{"onetime": 2, "retainer": 2}'::jsonb,
    package_descriptions JSONB DEFAULT '{
        "onetime": {"starter": "", "growth": "", "premium": "", "elite": ""},
        "retainer": {"starter": "", "growth": "", "premium": "", "elite": ""}
    }'::jsonb,
    button_links JSONB DEFAULT '{
        "onetime": {"starter": "", "growth": "", "premium": "", "elite": ""},
        "retainer": {"starter": "", "growth": "", "premium": "", "elite": ""}
    }'::jsonb,
    package_names JSONB DEFAULT '{
        "onetime": {"starter": "Starter", "growth": "Growth", "premium": "Premium", "elite": "Elite"},
        "retainer": {"starter": "Starter", "growth": "Growth", "premium": "Premium", "elite": "Elite"}
    }'::jsonb,
    active_packages JSONB DEFAULT '{
        "onetime": ["starter", "growth", "premium"],
        "retainer": ["starter", "growth", "premium"]
    }'::jsonb,
    package_data JSONB,

    brand_color TEXT DEFAULT '#ff0044',
    logo_url TEXT,
    guarantee TEXT,
    urgency TEXT,

    created_by UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_package_configs_created_by ON public.package_configs(created_by);
CREATE INDEX idx_package_configs_created_date ON public.package_configs(created_date DESC);
CREATE INDEX idx_package_configs_package_set_name ON public.package_configs(package_set_name);
CREATE INDEX idx_package_configs_package_data ON public.package_configs USING GIN(package_data);
CREATE INDEX idx_package_configs_active_packages ON public.package_configs USING GIN(active_packages);

ALTER TABLE public.package_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own package configs"
    ON public.package_configs
    FOR SELECT
    USING (created_by::text = auth.uid()::text);

CREATE POLICY "Users can create their own package configs"
    ON public.package_configs
    FOR INSERT
    WITH CHECK (created_by::text = auth.uid()::text);

CREATE POLICY "Users can update their own package configs"
    ON public.package_configs
    FOR UPDATE
    USING (created_by::text = auth.uid()::text);

CREATE POLICY "Users can delete their own package configs"
    ON public.package_configs
    FOR DELETE
    USING (created_by::text = auth.uid()::text);

CREATE POLICY "Admins can manage all package configs"
    ON public.package_configs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "Service role can manage all package configs"
    ON public.package_configs
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE TRIGGER update_package_configs_updated_date
    BEFORE UPDATE ON public.package_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_configs TO authenticated;
GRANT ALL ON public.package_configs TO service_role;

-- =====================================================
-- 4. CREATE HEALTH REPORTS TABLE
-- =====================================================

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

CREATE INDEX idx_health_reports_report_date ON public.health_reports(report_date DESC);
CREATE INDEX idx_health_reports_status ON public.health_reports(status);
CREATE INDEX idx_health_reports_created_date ON public.health_reports(created_date DESC);
CREATE INDEX idx_health_reports_fixes ON public.health_reports USING GIN(fixes);
CREATE INDEX idx_health_reports_issues ON public.health_reports USING GIN(issues);

ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Service role can manage health reports"
    ON public.health_reports
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE TRIGGER update_health_reports_updated_date
    BEFORE UPDATE ON public.health_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

GRANT SELECT ON public.health_reports TO authenticated;
GRANT ALL ON public.health_reports TO service_role;

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

-- =====================================================
-- 5. CREATE HELP REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_by UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_help_requests_created_by ON public.help_requests(created_by);
CREATE INDEX idx_help_requests_created_date ON public.help_requests(created_date DESC);
CREATE INDEX idx_help_requests_status ON public.help_requests(status);

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own help requests"
    ON public.help_requests
    FOR SELECT
    USING (created_by::text = auth.uid()::text);

CREATE POLICY "Users can create help requests"
    ON public.help_requests
    FOR INSERT
    WITH CHECK (created_by::text = auth.uid()::text OR created_by IS NULL);

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

CREATE POLICY "Service role can manage help requests"
    ON public.help_requests
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE TRIGGER update_help_requests_updated_date
    BEFORE UPDATE ON public.help_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

GRANT SELECT, INSERT ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;

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

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- All tables have been created successfully.
-- You can now start using your Supabase database!
-- =====================================================
