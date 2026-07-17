-- Rename the `token` column to `tokenHash` on the Invitation table.
-- This brings the DB schema in sync with the Prisma schema and service code,
-- which have been referencing `tokenHash` since the security fix was applied.

-- Step 1: Drop the old unique index on `token`
DROP INDEX IF EXISTS "Invitation_token_key";

-- Step 2: Rename the column
ALTER TABLE "Invitation" RENAME COLUMN "token" TO "tokenHash";

-- Step 3: Recreate the unique index under the new column name
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
