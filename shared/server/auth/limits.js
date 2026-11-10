// Block 8 counter rules, shared by SSR and JSON API. Inject schema-aware query.
export const loginNeedsCaptcha = (emailFailures, ipFailures) => emailFailures >= 3 || ipFailures >= 10;
export function createLimits(query) {
  async function count(key, increment = false) {
    if (increment) await query(`INSERT INTO block8_auth.limits(key,count) VALUES($1,1) ON CONFLICT(key) DO UPDATE SET
      count=CASE WHEN block8_auth.limits.started_at<now()-interval '15 minutes' THEN 1 ELSE block8_auth.limits.count+1 END,
      started_at=CASE WHEN block8_auth.limits.started_at<now()-interval '15 minutes' THEN now() ELSE block8_auth.limits.started_at END`, [key]);
    const row = (await query("SELECT count,locked_until FROM block8_auth.limits WHERE key=$1 AND (started_at>now()-interval '15 minutes' OR locked_until>now())", [key])).rows[0];
    return row?.count || 0;
  }
  return { count };
}
