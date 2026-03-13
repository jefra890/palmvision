-- CreateTable
CREATE TABLE "palm_readings" (
    "id" TEXT NOT NULL,
    "hand" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "palm_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "palm_readings_userId_idx" ON "palm_readings"("userId");

-- AddForeignKey
ALTER TABLE "palm_readings" ADD CONSTRAINT "palm_readings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
