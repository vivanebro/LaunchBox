-- Create PackageConfig table
CREATE TABLE IF NOT EXISTS public.package_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_set_name TEXT,
    business_name TEXT,

    -- Pricing fields
    price_starter NUMERIC,
    price_growth NUMERIC,
    price_premium NUMERIC,
    price_elite NUMERIC,

    -- JSONB fields for complex data structures
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

    -- Branding fields
    brand_color TEXT DEFAULT '#ff0044',
    logo_url TEXT,
    guarantee TEXT,
    urgency TEXT,

    -- Metadata
    created_by UUID REFERENCES public.users(id),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_package_configs_created_by ON public.package_configs(created_by);
CREATE INDEX idx_package_configs_created_date ON public.package_configs(created_date DESC);
CREATE INDEX idx_package_configs_package_set_name ON public.package_configs(package_set_name);

-- Create GIN indexes for JSONB columns to enable faster searches
CREATE INDEX idx_package_configs_package_data ON public.package_configs USING GIN(package_data);
CREATE INDEX idx_package_configs_active_packages ON public.package_configs USING GIN(active_packages);

-- Enable Row Level Security
ALTER TABLE public.package_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own package configs
CREATE POLICY "Users can read their own package configs"
    ON public.package_configs
    FOR SELECT
    USING (created_by::text = auth.uid()::text);

-- Create policy for users to create their own package configs
CREATE POLICY "Users can create their own package configs"
    ON public.package_configs
    FOR INSERT
    WITH CHECK (created_by::text = auth.uid()::text);

-- Create policy for users to update their own package configs
CREATE POLICY "Users can update their own package configs"
    ON public.package_configs
    FOR UPDATE
    USING (created_by::text = auth.uid()::text);

-- Create policy for users to delete their own package configs
CREATE POLICY "Users can delete their own package configs"
    ON public.package_configs
    FOR DELETE
    USING (created_by::text = auth.uid()::text);

-- Create policy for admins to manage all package configs
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

-- Create policy for service role to manage all package configs
CREATE POLICY "Service role can manage all package configs"
    ON public.package_configs
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create trigger for updated_date
CREATE TRIGGER update_package_configs_updated_date
    BEFORE UPDATE ON public.package_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_date_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_configs TO authenticated;
GRANT ALL ON public.package_configs TO service_role;
