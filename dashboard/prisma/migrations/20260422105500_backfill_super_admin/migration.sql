INSERT INTO "users" ("id", "name", "email", "password", "isActive", "createdAt", "updatedAt")
VALUES (
  'user_platform_super_admin',
  'Super Admin',
  'super@koperasi.id',
  '$2b$12$a3SBE9lnKLdcw.AYYZgQduLRA92CJyMvihHdM.gLgx2ZfOtExB4jW',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "user_roles" ("id", "userId", "role")
SELECT
  'role_platform_super_admin',
  "id",
  'SUPER_ADMIN'
FROM "users"
WHERE email = 'super@koperasi.id'
ON CONFLICT ("userId", "role") DO NOTHING;

