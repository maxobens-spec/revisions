import { createClient } from "@supabase/supabase-js";

// Client serveur uniquement : utilise la clé secrète, qui contourne RLS.
// Ne jamais importer ce fichier dans du code qui s'exécute côté navigateur.
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL et SUPABASE_SECRET_KEY doivent être définis (voir .env.local)");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
