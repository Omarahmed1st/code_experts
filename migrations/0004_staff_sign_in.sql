-- 0004: staff sign-in (Phase 4). 0001-0003 are never edited.
--
-- Fixed-window counters that slow down password guessing. One row per key, e.g.
--   login:email:<sha-256 of the email>   failed sign-ins for one account
--   login:ip:<address>                   failed sign-ins from one address
-- Keys never hold a plain email address. Rows are overwritten when their window
-- ends, and old rows are deleted by the sign-in code, so the table stays small.
CREATE TABLE rate_limits (
  key           TEXT PRIMARY KEY CHECK (length(key) BETWEEN 1 AND 200),
  window_start  INTEGER NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0)
);
CREATE INDEX rate_limits_window_idx ON rate_limits (window_start);

-- Admin lists filter the audit log by who did it.
CREATE INDEX admin_audit_logs_actor_idx ON admin_audit_logs (actor_user_id, created_at);
