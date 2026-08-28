import { createClient } from "@supabase/supabase-js";

// Both values are meant to be public. They ship inside the JavaScript bundle
// and do no more than name the project: what actually protects the data is the
// row level security policies on app_state and inbox, which only ever expose
// rows belonging to the signed-in user. The service_role key is the one that
// must never appear here.
const SUPABASE_URL = "https://jcjjwoiaialofowdgryd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_m15c_qd-klwZ_--S-F9qVA_l9pPEjcl";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Sign-in happens with a password inside the app, so no auth redirect ever
    // comes back and there is no URL fragment to parse. Leaving this on would
    // only make the app inspect every launch URL for tokens it never receives.
    detectSessionInUrl: false,
  },
});
