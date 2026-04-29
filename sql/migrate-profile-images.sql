-- Migration: assign DiceBear Notionists avatars (with deterministic variation)
-- to users who do not have uploaded/custom profile photos.
-- Run once via phpMyAdmin SQL tab (or mysql CLI).
--
-- Safety:
-- - Keeps uploaded/custom photos untouched (/api/uploads/profiles/...).
-- - Updates empty images and previously generated DiceBear images.
-- - Excludes admin accounts.

START TRANSACTION;

UPDATE users
SET profile_image = CONCAT(
    'https://api.dicebear.com/9.x/notionists/svg',
    '?seed=',
    LOWER(COALESCE(NULLIF(username, ''), CONCAT('user', id))),
    '&backgroundType=',
    CASE
      WHEN MOD(id, 3) = 0 THEN 'gradientLinear'
      ELSE 'solid'
    END,
    '&backgroundColor=',
    CASE MOD(id, 8)
      WHEN 0 THEN 'b6e3f4,c0aede'
      WHEN 1 THEN 'd1d4f9,ffd5dc'
      WHEN 2 THEN 'ffdfbf,e6f4ea'
      WHEN 3 THEN 'dbeafe,fce7f3'
      WHEN 4 THEN 'ede9fe,fef3c7'
      WHEN 5 THEN 'dcfce7,b6e3f4'
      WHEN 6 THEN 'fde68a,d1fae5'
      ELSE 'f5d0fe,bbf7d0'
    END,
    '&glassesProbability=',
    CASE MOD(id, 5)
      WHEN 0 THEN '24'
      WHEN 1 THEN '12'
      ELSE '0'
    END,
    '&beardProbability=',
    CASE MOD(id, 6)
      WHEN 0 THEN '22'
      WHEN 1 THEN '10'
      ELSE '0'
    END,
    '&bodyIconProbability=',
    CASE
      WHEN MOD(id, 9) = 0 THEN '14'
      ELSE '0'
    END,
    '&gestureProbability=',
    CASE
      WHEN MOD(id, 10) = 0 THEN '18'
      ELSE '0'
    END,
    '&flip=',
    CASE
      WHEN MOD(id, 2) = 0 THEN 'false'
      ELSE 'true'
    END
)
WHERE role <> 'admin'
  AND (
    profile_image IS NULL
    OR TRIM(profile_image) = ''
    OR profile_image LIKE 'https://api.dicebear.com/9.x/adventurer-neutral/%'
    OR profile_image LIKE 'https://api.dicebear.com/9.x/notionists/%'
    OR profile_image LIKE 'https://api.dicebear.com/9.x/notionists-neutral/%'
  )
  AND profile_image NOT LIKE '/api/uploads/profiles/%';

COMMIT;

-- Optional verification:
-- SELECT
--   SUM(CASE WHEN profile_image IS NULL OR TRIM(profile_image) = '' THEN 1 ELSE 0 END) AS users_still_missing_profile_image,
--   COUNT(*) AS total_users
-- FROM users
-- WHERE role <> 'admin';
