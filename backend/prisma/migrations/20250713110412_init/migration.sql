-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "handicap" DOUBLE PRECISION,
    "profile_image_url" TEXT,
    "home_course_id" UUID,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "friend_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_clubs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "shaft_type" TEXT,
    "avg_distance" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state_province" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "location" TEXT,
    "timezone" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tee_boxes" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "rating" DOUBLE PRECISION,
    "slope" INTEGER,
    "total_yards" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tee_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holes" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "hole_number" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "handicap_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hole_tees" (
    "id" UUID NOT NULL,
    "hole_id" UUID NOT NULL,
    "tee_box_id" UUID NOT NULL,
    "distance_yards" INTEGER NOT NULL,

    CONSTRAINT "hole_tees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_features" (
    "id" UUID NOT NULL,
    "hole_id" UUID NOT NULL,
    "feature_type" TEXT NOT NULL,
    "name" TEXT,
    "boundary" TEXT,
    "center_point" TEXT,
    "created_by" UUID,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pin_positions" (
    "id" UUID NOT NULL,
    "hole_id" UUID NOT NULL,
    "position" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pin_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "tee_box_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "weather_conditions" JSONB,
    "walking_riding" TEXT NOT NULL DEFAULT 'walking',
    "round_type" TEXT NOT NULL DEFAULT 'casual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_participants" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_scorer" BOOLEAN NOT NULL DEFAULT false,
    "playing_handicap" INTEGER,
    "tee_box_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "round_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hole_scores" (
    "id" UUID NOT NULL,
    "round_participant_id" UUID NOT NULL,
    "hole_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "putts" INTEGER,
    "fairway_hit" BOOLEAN,
    "green_in_regulation" BOOLEAN,
    "penalties" INTEGER NOT NULL DEFAULT 0,
    "sand_saves" INTEGER NOT NULL DEFAULT 0,
    "up_and_downs" BOOLEAN,
    "updated_by" UUID NOT NULL,
    "sync_conflict_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hole_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shots" (
    "id" UUID NOT NULL,
    "round_participant_id" UUID NOT NULL,
    "hole_id" UUID NOT NULL,
    "shot_number" INTEGER NOT NULL,
    "club_id" UUID,
    "start_position" TEXT NOT NULL,
    "end_position" TEXT NOT NULL,
    "distance_yards" DOUBLE PRECISION NOT NULL,
    "shot_shape" TEXT,
    "lie_type" TEXT NOT NULL,
    "shot_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "record_id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),
    "conflict_resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" UUID NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" UUID NOT NULL,
    "conflicting_data" JSONB NOT NULL,
    "resolution_method" TEXT,
    "resolved_data" JSONB,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_performance" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "conditions" JSONB,
    "avg_distance" DOUBLE PRECISION NOT NULL,
    "accuracy_percentage" DOUBLE PRECISION NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_recommendations" (
    "id" UUID NOT NULL,
    "hole_id" UUID NOT NULL,
    "from_position" TEXT NOT NULL,
    "to_target" TEXT NOT NULL,
    "distance_yards" DOUBLE PRECISION NOT NULL,
    "recommended_club" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_user_id_friend_id_key" ON "friendships"("user_id", "friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "holes_course_id_hole_number_key" ON "holes"("course_id", "hole_number");

-- CreateIndex
CREATE UNIQUE INDEX "hole_tees_hole_id_tee_box_id_key" ON "hole_tees"("hole_id", "tee_box_id");

-- CreateIndex
CREATE UNIQUE INDEX "round_participants_round_id_user_id_key" ON "round_participants"("round_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hole_scores_round_participant_id_hole_id_key" ON "hole_scores"("round_participant_id", "hole_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_home_course_id_fkey" FOREIGN KEY ("home_course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_clubs" ADD CONSTRAINT "user_clubs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tee_boxes" ADD CONSTRAINT "tee_boxes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holes" ADD CONSTRAINT "holes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hole_tees" ADD CONSTRAINT "hole_tees_hole_id_fkey" FOREIGN KEY ("hole_id") REFERENCES "holes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hole_tees" ADD CONSTRAINT "hole_tees_tee_box_id_fkey" FOREIGN KEY ("tee_box_id") REFERENCES "tee_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_features" ADD CONSTRAINT "course_features_hole_id_fkey" FOREIGN KEY ("hole_id") REFERENCES "holes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_features" ADD CONSTRAINT "course_features_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_positions" ADD CONSTRAINT "pin_positions_hole_id_fkey" FOREIGN KEY ("hole_id") REFERENCES "holes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_positions" ADD CONSTRAINT "pin_positions_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_tee_box_id_fkey" FOREIGN KEY ("tee_box_id") REFERENCES "tee_boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_participants" ADD CONSTRAINT "round_participants_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_participants" ADD CONSTRAINT "round_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_participants" ADD CONSTRAINT "round_participants_tee_box_id_fkey" FOREIGN KEY ("tee_box_id") REFERENCES "tee_boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hole_scores" ADD CONSTRAINT "hole_scores_round_participant_id_fkey" FOREIGN KEY ("round_participant_id") REFERENCES "round_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hole_scores" ADD CONSTRAINT "hole_scores_hole_id_fkey" FOREIGN KEY ("hole_id") REFERENCES "holes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hole_scores" ADD CONSTRAINT "hole_scores_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_round_participant_id_fkey" FOREIGN KEY ("round_participant_id") REFERENCES "round_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_hole_id_fkey" FOREIGN KEY ("hole_id") REFERENCES "holes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "user_clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_user_fkey" FOREIGN KEY ("round_participant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_performance" ADD CONSTRAINT "club_performance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_performance" ADD CONSTRAINT "club_performance_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "user_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_recommendations" ADD CONSTRAINT "course_recommendations_hole_id_fkey" FOREIGN KEY ("hole_id") REFERENCES "holes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
