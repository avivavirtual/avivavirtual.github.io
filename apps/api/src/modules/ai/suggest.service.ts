import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'OPS_MANAGER']);

@Injectable()
export class SuggestService {
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'missing-key' });

  constructor(private readonly prisma: PrismaService) {}

  async suggestReply(contactId: string, user: AuthenticatedRequest['user']): Promise<{ suggestion: string; confidence: number }> {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, ...this.contactScope(user) },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!contact) throw new NotFoundException('Contact not found');
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

  private contactScope(user: AuthenticatedRequest['user']) {
    if (PLATFORM_ROLES.has(user.role)) return {};
    if (!user.organizationId) throw new ForbiddenException('User is not assigned to an organization');
    return { organizationId: user.organizationId };
  }
}
