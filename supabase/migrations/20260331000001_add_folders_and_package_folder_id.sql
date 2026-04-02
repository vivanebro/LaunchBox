-- Clients & Projects: folders + package assignment
-- One-level subfolders: parent_id may only reference a root folder (parent_id IS NULL).

CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_example BOOLEAN NOT NULL DEFAULT FALSE,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_created_by ON public.folders(created_by);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by_parent ON public.folders(created_by, parent_id);

COMMENT ON TABLE public.folders IS 'User-owned folders for grouping packages (and future budgets/contracts)';
COMMENT ON COLUMN public.folders.is_example IS 'Sample folder shown on first visit; user may delete';

-- Subfolders may only attach to a root folder (parent of parent is null)
CREATE OR REPLACE FUNCTION public.folders_enforce_one_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.folders p
            WHERE p.id = NEW.parent_id AND p.parent_id IS NULL
        ) THEN
            RAISE EXCEPTION 'Sub-folders can only be created under a top-level folder';
        END IF;
        IF EXISTS (
            SELECT 1 FROM public.folders p
            WHERE p.id = NEW.parent_id AND p.created_by IS DISTINCT FROM NEW.created_by
        ) THEN
            RAISE EXCEPTION 'Folder parent must belong to the same user';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_folders_enforce_one_level ON public.folders;
CREATE TRIGGER tr_folders_enforce_one_level
    BEFORE INSERT OR UPDATE OF parent_id, created_by ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION public.folders_enforce_one_level();

CREATE TRIGGER update_folders_updated_date
    BEFORE UPDATE ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_date_column();

-- Before deleting a folder: unassign packages. Subfolders are removed via ON DELETE CASCADE; each child row fires this too.
CREATE OR REPLACE FUNCTION public.folders_before_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.package_configs SET folder_id = NULL, updated_date = NOW()
    WHERE folder_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_folders_before_delete ON public.folders;
CREATE TRIGGER tr_folders_before_delete
    BEFORE DELETE ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION public.folders_before_delete();

ALTER TABLE public.package_configs
    ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_package_configs_folder_id ON public.package_configs(folder_id);

-- Ensure package folder belongs to same owner as package
CREATE OR REPLACE FUNCTION public.package_configs_folder_same_owner()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.folder_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.folders f
            WHERE f.id = NEW.folder_id AND f.created_by = NEW.created_by
        ) THEN
            RAISE EXCEPTION 'Package folder must belong to the same user as the package';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_package_configs_folder_owner ON public.package_configs;
CREATE TRIGGER tr_package_configs_folder_owner
    BEFORE INSERT OR UPDATE OF folder_id, created_by ON public.package_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.package_configs_folder_same_owner();

-- User preference: hide post copy-link folder assignment prompt
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS hide_copy_link_folder_prompt BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.users.hide_copy_link_folder_prompt IS 'When true, skip folder assignment prompt after copying package link';

-- RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own folders"
    ON public.folders
    FOR SELECT
    USING (created_by::text = auth.uid()::text);

CREATE POLICY "Users can create their own folders"
    ON public.folders
    FOR INSERT
    WITH CHECK (created_by::text = auth.uid()::text);

CREATE POLICY "Users can update their own folders"
    ON public.folders
    FOR UPDATE
    USING (created_by::text = auth.uid()::text);

CREATE POLICY "Users can delete their own folders"
    ON public.folders
    FOR DELETE
    USING (created_by::text = auth.uid()::text);

CREATE POLICY "Admins can manage all folders"
    ON public.folders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "Service role can manage all folders"
    ON public.folders
    FOR ALL
    USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;
GRANT ALL ON public.folders TO service_role;
