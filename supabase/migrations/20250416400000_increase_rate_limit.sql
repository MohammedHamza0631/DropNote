/*
  # Increase Rate Limit for Link Dumps

  1. Update the rate limiting policy:
    - Increase from 1 to 3 dumps per IP per minute
*/

-- Drop the existing policy
DROP POLICY "Anyone can create dumps" ON link_dumps;

-- Create new policy with updated rate limit
CREATE POLICY "Anyone can create dumps"
  ON link_dumps
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Rate limit: 3 dumps per IP per minute
    (SELECT COUNT(*) FROM link_dumps
      WHERE ip_address = CURRENT_SETTING('request.headers')::json->>'cf-connecting-ip'
      AND created_at > NOW() - INTERVAL '1 minute'
    ) < 3
  ); 