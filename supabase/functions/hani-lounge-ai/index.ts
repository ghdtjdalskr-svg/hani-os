// Owner-only lounge generation. No database access or client-visible credentials.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { createLoungeHandler } from "./handler.mjs";

// Same authenticated-user lookup/options as hani-second-opinion.
async function authenticatedUser(req: Request, url: string, key: string) {
  const client = createClient(url, key, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: { user }, error } = await client.auth.getUser();
  return error ? null : user;
}
Deno.serve(createLoungeHandler({ env: (name: string) => Deno.env.get(name), authenticatedUser }));
