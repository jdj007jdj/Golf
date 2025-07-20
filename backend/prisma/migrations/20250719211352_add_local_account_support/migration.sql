-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_type" TEXT NOT NULL DEFAULT 'online',
ADD COLUMN     "converted_at" TIMESTAMP(3),
ADD COLUMN     "local_device_id" TEXT;

-- CreateTable
CREATE TABLE "account_conversions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "local_device_id" TEXT NOT NULL,
    "data_snapshot" JSONB NOT NULL,
    "rounds_converted" INTEGER NOT NULL,
    "shots_converted" INTEGER NOT NULL,
    "games_converted" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "account_conversions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "account_conversions" ADD CONSTRAINT "account_conversions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
