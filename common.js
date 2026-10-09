// Shared helpers for the public site and the admin panel.
// Only publishable/anon keys may be used here — never service_role or secret keys.
window.FNAF = (() => {
  const PLACEHOLDER_URL = 'YOUR-PROJECT';
  const PLACEHOLDER_KEY = 'YOUR_';

  function getConfig() {
    const cfg = window.FNAF_SUPABASE_CONFIG;
    if (!cfg || typeof cfg.url !== 'string' || typeof cfg.anonKey !== 'string') return null;
    const url = cfg.url.trim();
    const anonKey = cfg.anonKey.trim();
    if (!url || !anonKey) return null;
    if (url.includes(PLACEHOLDER_URL) || anonKey.includes(PLACEHOLDER_KEY)) return null;
    if (!/^https:\/\//.test(url)) return null;
    return { url, anonKey };
  }

  function createClient() {
    const cfg = getConfig();
    if (!cfg || !window.supabase) return null;
    return window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  return { getConfig, createClient };
})();
