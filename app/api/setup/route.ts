import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// One-time setup: creates the messages (and watchlist) tables if they don't exist.
// Hit GET /api/setup once, then it's done.
export async function GET() {
  const supabase = createAdminClient()

  // Use raw SQL via the pg connection through supabase-js rpc if available,
  // otherwise fall back to attempting inserts to detect table presence.
  // We'll use the supabase management approach via supabase-js v2 pgrest.

  const results: Record<string, string> = {}

  // --- messages table ---
  const { error: msgErr } = await supabase.rpc('setup_messages_table').maybeSingle()
  if (msgErr && msgErr.code !== 'PGRST202') {
    results.messages_rpc = msgErr.message
  }

  // Check if messages table exists by selecting from it
  const { error: checkErr } = await supabase.from('messages').select('id').limit(1)
  if (checkErr?.code === 'PGRST205' || checkErr?.message?.includes('does not exist')) {
    results.messages_status = 'TABLE MISSING — run the SQL in Supabase dashboard'
  } else if (checkErr) {
    results.messages_status = 'error: ' + checkErr.message
  } else {
    results.messages_status = 'OK — table exists'
  }

  // --- watchlist table ---
  const { error: wlErr } = await supabase.from('watchlist').select('id').limit(1)
  if (wlErr?.code === 'PGRST205' || wlErr?.message?.includes('does not exist')) {
    results.watchlist_status = 'TABLE MISSING — run the SQL in Supabase dashboard'
  } else if (wlErr) {
    results.watchlist_status = 'error: ' + wlErr.message
  } else {
    results.watchlist_status = 'OK — table exists'
  }

  const sql = `
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender      text NOT NULL CHECK (sender IN ('customer', 'seller')),
  body        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_read_own_messages" ON messages;
CREATE POLICY "customers_read_own_messages" ON messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "customers_send_messages" ON messages;
CREATE POLICY "customers_send_messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id AND sender = 'customer');
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_manage_own_watchlist" ON watchlist;
CREATE POLICY "users_manage_own_watchlist" ON watchlist USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
`

  return NextResponse.json({ results, sql_to_run: sql })
}
