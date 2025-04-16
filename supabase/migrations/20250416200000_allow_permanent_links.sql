/*
  # Allow Permanent Links

  1. Modify `link_dumps` table:
    - Change `expires_at` column to allow NULL values (for permanent links)
    
  2. Update RLS policy:
    - Update policy to also allow access to links with NULL expires_at
*/

-- Modify the expires_at column to allow NULL values
ALTER TABLE link_dumps ALTER COLUMN expires_at DROP NOT NULL;

-- Update the RLS policy to also allow access to permanent links
DROP POLICY "Anyone can read non-expired dumps" ON link_dumps;

CREATE POLICY "Anyone can read non-expired or permanent dumps"
  ON link_dumps
  FOR SELECT
  TO anon
  USING (expires_at > NOW() OR expires_at IS NULL); 