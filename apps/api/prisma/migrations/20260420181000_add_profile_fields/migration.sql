-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "name" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "cvPath" TEXT,
ADD COLUMN     "cvOriginalName" TEXT,
ADD COLUMN     "cvUploadedAt" TIMESTAMP(3);
