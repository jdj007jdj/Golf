-- AlterTable
ALTER TABLE "round_participants" ADD COLUMN     "guest_handicap" INTEGER,
ADD COLUMN     "guest_name" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "game_type" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_scores" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "round_participant_id" UUID NOT NULL,
    "hole_number" INTEGER NOT NULL,
    "score_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_friends" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "handicap" INTEGER,
    "linked_user_id" UUID,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "last_played_at" TIMESTAMP(3),
    "rounds_played" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_scores_game_id_round_participant_id_hole_number_key" ON "game_scores"("game_id", "round_participant_id", "hole_number");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_round_participant_id_fkey" FOREIGN KEY ("round_participant_id") REFERENCES "round_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_friends" ADD CONSTRAINT "local_friends_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_friends" ADD CONSTRAINT "local_friends_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
