-- QA finding 2026-05-03: lock down public read access on PII tables.
-- Pre-existing wide SELECT policies leaked emails, IPs, and full customer
-- rosters to anyone with the public anon key.
--
-- Strategy: revoke whole-table SELECT for anon, then grant only the safe
-- columns. Column-level REVOKE alone is silently overridden by Supabase's
-- default table-level GRANT.

-- ============================================================
-- signed_contracts: drop public SELECT entirely. Owners read via
-- signed_contracts_owner_select. Sign-confirmation page receives the
-- row from its own INSERT, no list access needed.
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read signed contracts by contract" ON public.signed_contracts;
DROP POLICY IF EXISTS signed_contracts_public_select_via_link ON public.signed_contracts;

-- ============================================================
-- users: keep public-by-creator-slug policy but strip sensitive cols
-- ============================================================
REVOKE SELECT ON public.users FROM anon;
GRANT SELECT (
  id, full_name, role, creator_slug, default_currency,
  created_date, updated_date
) ON public.users TO anon;

-- ============================================================
-- package_configs: keep public-share policy but strip sensitive cols
-- ============================================================
REVOKE SELECT ON public.package_configs FROM anon;
GRANT SELECT (
  id, package_set_name, business_name,
  price_starter, price_growth, price_premium, price_elite,
  popular_package_index, package_descriptions, button_links, package_names,
  active_packages, package_data, brand_color, logo_url, guarantee, urgency,
  created_date, updated_date,
  headline, sub_headline, price_range, project_duration,
  duration_min, duration_max, duration_unit,
  price_starter_retainer, price_growth_retainer, price_premium_retainer, price_elite_retainer,
  pricing_availability, pricing_label_onetime, pricing_label_retainer,
  pricing_button_label_onetime, pricing_button_label_retainer,
  currency, starter_duration, growth_duration, premium_duration,
  core_deliverables, extras_bonuses, niches, package_durations,
  from_template, logo_height, "currentDesign", "pricingMode",
  "popularPackageIndex", "popularBadgeText",
  creator_slug, public_slug,
  show_excluded_deliverables, show_package_buttons_in_edit_mode,
  retainer_discount_text,
  deliverables_label, bonuses_label, show_bonuses,
  commitment_discount_enabled, commitment_discount_percent,
  commitment_discount_label, commitment_discount_prices,
  custom_offer_tiers, addons, addons_label,
  created_by
) ON public.package_configs TO anon;

-- ============================================================
-- quiz_configs: keep public-when-active policy but hide created_by
-- ============================================================
REVOKE SELECT ON public.quiz_configs FROM anon;
GRANT SELECT (
  id, quiz_name, welcome_title, welcome_subtitle, welcome_button_text,
  brand_color, logo_url, business_name, questions, pricing_config,
  tier_config, cta_type, cta_link, currency, is_active,
  created_date, updated_date
) ON public.quiz_configs TO anon;
