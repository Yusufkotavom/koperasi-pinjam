DO $$
DECLARE
  admin_id TEXT;
  company_id TEXT;
BEGIN
  SELECT id INTO admin_id
  FROM "users"
  WHERE email = 'admin@koperasi.id'
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    INSERT INTO "companies" ("id", "name", "slug", "email", "ownerId", "createdAt", "updatedAt")
    VALUES (
      'company_demo_default',
      'Koperasi Demo Sejahtera',
      'koperasi-demo-sejahtera',
      'admin@koperasi.id',
      admin_id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("slug") DO UPDATE
    SET
      "name" = EXCLUDED."name",
      "email" = EXCLUDED."email",
      "ownerId" = EXCLUDED."ownerId",
      "isActive" = true,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING id INTO company_id;

    UPDATE "users"
    SET "companyId" = company_id
    WHERE email IN (
      'admin@koperasi.id',
      'manager@koperasi.id',
      'teller@koperasi.id',
      'akuntansi@koperasi.id'
    );

    INSERT INTO "user_roles" ("id", "userId", "role")
    VALUES ('role_owner_demo_admin', admin_id, 'OWNER')
    ON CONFLICT ("userId", "role") DO NOTHING;
  END IF;
END $$;

