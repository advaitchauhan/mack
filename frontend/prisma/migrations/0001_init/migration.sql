-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "elevenLabsConversationId" TEXT,
    "scenarioType" TEXT NOT NULL,
    "audioUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "timestamp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioAgent" (
    "scenarioType" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "configHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioAgent_pkey" PRIMARY KEY ("scenarioType")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_elevenLabsConversationId_key" ON "Conversation"("elevenLabsConversationId");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_conversationId_key" ON "Feedback"("conversationId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Supabase exposes the public schema through its REST API using the public
-- anon key. Row level security with no policies blocks that path entirely;
-- the app reaches these tables only through Prisma's server connection.
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScenarioAgent" ENABLE ROW LEVEL SECURITY;
