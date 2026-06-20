-- Enable the pgvector extension (Neon supports this natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- Store a 768-dim embedding for each checklist item (matches Gemini text-embedding-004)
ALTER TABLE "ChecklistItem" ADD COLUMN "embedding" vector(768);

-- HNSW index for fast cosine-distance similarity search
CREATE INDEX "ChecklistItem_embedding_idx"
  ON "ChecklistItem"
  USING hnsw ("embedding" vector_cosine_ops);
