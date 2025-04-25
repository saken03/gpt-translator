/*
  Warnings:

  - You are about to drop the `Auth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuthIdentity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Auth_userId_key";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "Session_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Auth";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuthIdentity";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Session";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalText" TEXT NOT NULL,
    "translatedText" TEXT,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Translation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Translation" ("id", "originalText", "sourceLanguage", "targetLanguage", "translatedText", "userId") SELECT "id", "originalText", "sourceLanguage", "targetLanguage", "translatedText", "userId" FROM "Translation";
DROP TABLE "Translation";
ALTER TABLE "new_Translation" RENAME TO "Translation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
