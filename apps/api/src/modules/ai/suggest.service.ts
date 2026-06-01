import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SuggestService {
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'missing-key' });

  constructor(private readonly prisma: PrismaService) {}

  async suggestReply(contactId: string): Promise<{ suggestion: string; confidence: number }> {
    const contact = await this.prisma.contact.findUniqueOrThrow({ where: { id: contactId }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } } });
    const history = contact.messages.reverse().map((message) => `${message.senderType}: ${message.content}`).join('\n');
    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_SUGGEST_MODEL ?? 'gpt-4o',
      messages: [
        { role: 'system', content: 'Suggest a concise, professional, empathetic agent reply. Max 3 sentences.' },
        { role: 'user', content: history },
      ],
    });
    return { suggestion: response.choices[0]?.message.content ?? '', confidence: 0.85 };
  }
}
