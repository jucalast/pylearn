/*
  Warnings:

  - You are about to drop the column `criteria` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `study_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `study_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `earnedAt` on the `user_achievements` table. All the data in the column will be lost.
  - The `progress` column on the `user_achievements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `user_stats` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[key]` on the table `achievements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `condition` to the `achievements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `achievements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `achievements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `study_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_stats" DROP CONSTRAINT "user_stats_userId_fkey";

-- AlterTable
ALTER TABLE "achievements" DROP COLUMN "criteria",
DROP COLUMN "title",
ADD COLUMN     "condition" JSONB NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "xpReward" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "learning_profiles" ADD COLUMN     "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalLessons" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "study_sessions" DROP COLUMN "completedAt",
DROP COLUMN "startedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_achievements" DROP COLUMN "earnedAt",
ADD COLUMN     "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "progress",
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastStudyDate" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalXP" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "user_stats";

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");
