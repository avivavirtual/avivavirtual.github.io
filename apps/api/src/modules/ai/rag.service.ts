import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Language, Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma/prisma.service';

type ContactHistoryItem = { senderType: string; content: string; createdAt?: Date };
type RetrievedChunk = { id: string; chunkText: string; score: number; articleTitle: string };
export type RagResponse = {
  answer: string;
  confidence: number;
  chunks: RetrievedChunk[];
  shouldEscalate: boolean;
  escalationReason?: 'LOW_CONFIDENCE' | 'MAX_TURNS_REACHED';
  handoffSummary?: string;
  intent?: string;
  intentConfidence?: number;
};

@Injectable()
export class RagService {
  private readonly openai: OpenAI;

  constructor(private readonly prisma: PrismaService, config: ConfigService) {
    this.openai = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY') ?? 'missing-key' });
  }

  async chat(params: { organizationId: string; query: string; language: Language; contactHistory: ContactHistoryItem[]; customerId?: string; contactId?: string; aiTurns?: number }): Promise<RagResponse> {
    const [settings, persona] = await Promise.all([
      this.prisma.aISettings.findUnique({ where: { organizationId: params.organizationId } }),
      this.prisma.aIPersona.findUnique({ where: { organizationId: params.organizationId } }),
    ]);
    const threshold = settings?.confidenceThreshold ?? 0.75;
    const topK = settings?.retrievalTopK ?? 5;
    const maxTurns = persona?.maxTurnsBeforeEscalate ?? 10;
    const nextTurnReachesLimit = (params.aiTurns ?? 0) + 1 >= maxTurns;
    const classification = await this.classifyIntent(params.query, params.language, settings?.enableIntentClassify ?? true);
    const embedding = await this.embed(params.query);
    const chunks = await this.retrieveChunks(params.organizationId, embedding, topK);
    const confidence = chunks.length === 0 ? 0 : chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length;
    const shouldEscalate = nextTurnReachesLimit || confidence < threshold;
    const escalationReason = nextTurnReachesLimit ? 'MAX_TURNS_REACHED' : 'LOW_CONFIDENCE';
    const answer = shouldEscalate
      ? this.escalationMessage(params.language, persona?.escalationMsgEN, persona?.escalationMsgFR)
      : await this.generateGroundedAnswer({ ...params, chunks, personaName: persona?.name ?? 'Ava', systemPrompt: params.language === 'FR' ? persona?.systemPromptFR : persona?.systemPromptEN });
    const handoffSummary = shouldEscalate ? await this.generateHandoffSummary(params.query, params.contactHistory, confidence) : undefined;
    return { answer, confidence, chunks, shouldEscalate, escalationReason: shouldEscalate ? escalationReason : undefined, handoffSummary, intent: classification.intent, intentConfidence: classification.confidence };
  }

  private async classifyIntent(query: string, language: Language, enabled: boolean): Promise<{ intent: string; confidence: number; language: Language }> {
    if (!enabled) return { intent: 'OTHER', confidence: 0, language };
    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Classify the customer support intent. Return JSON with intent, confidence, and language. Valid intents: BILLING_INQUIRY, TECHNICAL_SUPPORT, ACCOUNT_MANAGEMENT, APPOINTMENT_SCHEDULING, GENERAL_INQUIRY, COMPLAINT, CANCELLATION, SALES, OTHER.' },
        { role: 'user', content: query },
      ],
    });
    const parsed = this.parseClassification(response.choices[0]?.message.content);
    return { intent: parsed.intent ?? 'OTHER', confidence: parsed.confidence ?? 0.5, language: parsed.language ?? language };
  }

  private parseClassification(content?: string | null): { intent?: string; confidence?: number; language?: Language } {
    if (!content) return {};
    try {
      return JSON.parse(content) as { intent?: string; confidence?: number; language?: Language };
    } catch {
      return {};
    }
  }

  private async embed(input: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({ model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small', input });
    return response.data[0]?.embedding ?? [];
  }

  private async retrieveChunks(organizationId: string, embedding: number[], topK: number): Promise<RetrievedChunk[]> {
    if (embedding.length === 0) return [];
    const vector = `[${embedding.join(',')}]`;
    return this.prisma.$queryRaw<RetrievedChunk[]>(Prisma.sql`
      SELECT e.id, e."chunkText", 1 - (e.embedding <=> ${vector}::vector) AS score, a.title AS "articleTitle"
      FROM "Embedding" e
      JOIN "KnowledgeBaseArticle" a ON a.id = e."articleId"
      WHERE e."organizationId" = ${organizationId} AND a.status = 'APPROVED'
      ORDER BY e.embedding <=> ${vector}::vector
      LIMIT ${topK}
    `);
  }

  private async generateGroundedAnswer(params: { query: string; language: Language; contactHistory: ContactHistoryItem[]; chunks: RetrievedChunk[]; personaName: string; systemPrompt?: string | null }): Promise<string> {
    const context = params.chunks.map((chunk, index) => `[${index + 1}] ${chunk.chunkText}`).join('\n\n');
    const history = params.contactHistory.slice(-10).map((message) => `${message.senderType}: ${message.content}`).join('\n');
    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: `${params.systemPrompt ?? `You are ${params.personaName}, a white-labelled customer care AI.`}\nAnswer in ${params.language}. Use only retrieved context. If context is insufficient, say you will connect the customer with a specialist.` },
        { role: 'user', content: `Conversation history:\n${history}\n\nRetrieved context:\n${context}\n\nCustomer query: ${params.query}` },
      ],
    });
    return response.choices[0]?.message.content ?? this.escalationMessage(params.language);
  }

  private async generateHandoffSummary(query: string, history: ContactHistoryItem[], confidence: number): Promise<string> {
    const transcript = history.slice(-10).map((message) => `${message.senderType}: ${message.content}`).join('\n');
    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Create a concise handoff summary for a human customer care agent with issue, what AI tried, sentiment, and recommended next action.' },
        { role: 'user', content: `Current query: ${query}\nConfidence: ${confidence}\nHistory:\n${transcript}` },
      ],
    });
    return response.choices[0]?.message.content ?? `Low-confidence AI handoff for query: ${query}`;
  }

  private escalationMessage(language: Language, en?: string | null, fr?: string | null): string {
    if (language === 'FR') return fr ?? 'Je veux vous connecter avec un spécialiste pour mieux vous aider.';
    return en ?? 'I want to connect you with a specialist so we can help you properly.';
  }
}
