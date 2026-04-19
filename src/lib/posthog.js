import posthog from 'posthog-js';

const POSTHOG_KEY = 'phc_nFzCtz8Vvcdf888kxvbgeRBQEeD4LU5HZnu8QJBjPhdN';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let initialized = false;

export function initPosthog() {
  if (initialized || typeof window === 'undefined') return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export function identifyUser(user) {
  if (!initialized || !user?.id) return;
  posthog.identify(user.id, {
    email: user.email,
    created_at: user.created_at,
  });
}

export function resetPosthog() {
  if (!initialized) return;
  posthog.reset();
}

export { posthog };
