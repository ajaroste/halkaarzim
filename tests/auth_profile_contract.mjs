import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const authModal = fs.readFileSync("components/AuthModal.tsx", "utf8");
const profilePage = fs.readFileSync("app/profil/page.tsx", "utf8");
const profileRpc = fs.readFileSync("supabase/migrations/20260806180000_profile_update_permissions.sql", "utf8");
const usernameHardening = fs.readFileSync("supabase/migrations/20260807224500_profile_username_hardening.sql", "utf8");

test("unconfirmed email sessions are cleared before auth state is published", () => {
  assert.match(authModal, /await signOut\(session\)/);
  assert.match(authModal, /await signOut\(result\)/);
  assert.match(authModal, /email_confirmed_at/);
});

test("profile updates use the shared authenticated RPC client", () => {
  assert.match(profilePage, /listWatchlist, updateProfile/);
  assert.match(profilePage, /await updateProfile\(/);
  assert.doesNotMatch(profilePage, /browser\.rpc\("update_own_profile"/);
  assert.match(profilePage, /pattern="\[a-z0-9_\]\{3,30\}"/);
});

test("signed-out profile page exposes an auth entry point", () => {
  assert.match(profilePage, /Giriş yap veya hesap oluştur/);
  assert.match(profilePage, /<AuthModal open=\{authOpen\}/);
});

test("profile RPC only updates the authenticated user's own row", () => {
  assert.match(profileRpc, /where id = auth\.uid\(\)/i);
  assert.match(profileRpc, /\^\[a-z0-9_\]\{3,30\}\$/);
  assert.match(profileRpc, /grant execute on function public\.update_own_profile\(text, text\) to authenticated/i);
});

test("new-user usernames are sanitized and capped at 30 characters", () => {
  assert.match(usernameHardening, /\[\^a-z0-9_\]\+/);
  assert.match(usernameHardening, /left\(v_base, 23\)/);
  assert.match(usernameHardening, /substr\(replace\(new\.id::text, '-', ''\), 1, 6\)/);
  assert.match(usernameHardening, /left\(v_display_name, 40\)/);
});
