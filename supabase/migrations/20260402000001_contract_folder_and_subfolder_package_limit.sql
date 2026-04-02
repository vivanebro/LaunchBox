-- Add folder support to contracts and enforce sub-folder package limit.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_folder_id ON public.contracts(folder_id);

-- Ensure contract folder belongs to the same user as the contract.
CREATE OR REPLACE FUNCTION public.contracts_folder_same_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folder_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.folders f
      WHERE f.id = NEW.folder_id
        AND f.created_by::text = NEW.created_by::text
    ) THEN
      RAISE EXCEPTION 'Contract folder must belong to the same user as the contract';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_contracts_folder_owner ON public.contracts;
CREATE TRIGGER tr_contracts_folder_owner
  BEFORE INSERT OR UPDATE OF folder_id, created_by ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.contracts_folder_same_owner();

-- Extend package folder-owner trigger to also enforce:
-- sub-folders can hold at most one package.
CREATE OR REPLACE FUNCTION public.package_configs_folder_same_owner()
RETURNS TRIGGER AS $$
DECLARE
  target_folder public.folders%ROWTYPE;
  existing_count INTEGER;
BEGIN
  IF NEW.folder_id IS NOT NULL THEN
    SELECT * INTO target_folder FROM public.folders WHERE id = NEW.folder_id;
    IF NOT FOUND OR target_folder.created_by IS DISTINCT FROM NEW.created_by THEN
      RAISE EXCEPTION 'Package folder must belong to the same user as the package';
    END IF;

    IF target_folder.parent_id IS NOT NULL THEN
      SELECT COUNT(*) INTO existing_count
      FROM public.package_configs p
      WHERE p.folder_id = NEW.folder_id
        AND p.id IS DISTINCT FROM NEW.id;
      IF existing_count >= 1 THEN
        RAISE EXCEPTION 'Sub-folders can contain only one package';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Keep folder delete behavior: unassign contracts too.
CREATE OR REPLACE FUNCTION public.folders_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.package_configs
  SET folder_id = NULL, updated_date = NOW()
  WHERE folder_id = OLD.id;

  UPDATE public.contracts
  SET folder_id = NULL, updated_at = NOW()
  WHERE folder_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
