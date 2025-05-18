/*
  Warnings:

  - You are about to drop the column `fileContent` on the `Translation` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Translation` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `Translation` table. All the data in the column will be lost.

*/
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
    CONSTRAINT "Translation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Translation" ("id", "originalText", "sourceLanguage", "targetLanguage", "translatedText", "userId") SELECT "id", "originalText", "sourceLanguage", "targetLanguage", "translatedText", "userId" FROM "Translation";
DROP TABLE "Translation";
ALTER TABLE "new_Translation" RENAME TO "Translation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
