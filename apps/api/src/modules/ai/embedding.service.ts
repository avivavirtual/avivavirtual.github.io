import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EmbeddingService {
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'missing-key' });

  constructor(private readonly prisma: PrismaService) {}

  chunkArticle(content: string, chunkSize = 500, overlap = 50): string[] {
    if (chunkSize <= overlap) throw new BadRequestException('RAG_CHUNK_SIZE must be greater than RAG_CHUNK_OVERLAP');
    const words = content.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    for (let index = 0; index < words.length; index += chunkSize - overlap) {
      chunks.push(words.slice(index, index + chunkSize).join(' '));
    }
    return chunks;
  }

  async reindexArticle(articleId: string): Promise<number> {
    const article = await this.prisma.knowledgeBaseArticle.findUniqueOrThrow({ where: { id: articleId } });
    await this.prisma.embedding.deleteMany({ where: { articleId } });
    const chunks = this.chunkArticle(article.content, Number(process.env.RAG_CHUNK_SIZE ?? 500), Number(process.env.RAG_CHUNK_OVERLAP ?? 50));
    for (const [chunkIndex, chunkText] of chunks.entries()) {
      const embedding = await this.openai.embeddings.create({ model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small', input: chunkText });
      const vector = `[${embedding.data[0]?.embedding.join(',') ?? ''}]`;
      await this.prisma.$executeRaw(Prisma.sql`
        INSERT INTO "Embedding" (id, "organizationId", "articleId", "chunkIndex", "chunkText", "tokenCount", embedding, "createdAt")
        VALUES (${randomUUID()}, ${article.organizationId}, ${article.id}, ${chunkIndex}, ${chunkText}, ${chunkText.split(/\s+/).length}, ${vector}::vector, now())
      `);
    }
    return chunks.length;
  }
}
