/*
  # Create Link Dumps Schema

  1. New Tables
    - `link_dumps`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `links` (jsonb) - Array of links with titles
      - `expires_at` (timestamptz) - When the dump becomes inaccessible
      - `created_at` (timestamptz)
      - `ip_address` (text) - For rate limiting

  2. Security
    - Enable RLS on `link_dumps` table
    - Add policies for:
      - Anyone can create dumps (with rate limiting)
      - Anyone can read non-expired dumps
*/

CREATE TABLE link_dumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  links jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  ip_address text NOT NULL
);

-- Enable RLS
ALTER TABLE link_dumps ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create dumps
CREATE POLICY "Anyone can create dumps"
  ON link_dumps
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Rate limit: 1 dump per IP per minute
    NOT EXISTS (
      SELECT 1 FROM link_dumps
      WHERE ip_address = CURRENT_SETTING('request.headers')::json->>'cf-connecting-ip'
      AND created_at > NOW() - INTERVAL '1 minute'
    )
  );

-- Allow reading non-expired dumps
CREATE POLICY "Anyone can read non-expired dumps"
  ON link_dumps
  FOR SELECT
  TO anon
  USING (expires_at > NOW());

-- Create index for faster expiry checks
CREATE INDEX idx_link_dumps_expires_at ON link_dumps (expires_at);