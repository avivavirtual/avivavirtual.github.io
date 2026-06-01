import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Channel, ContactStatus, IntentCategory, Language } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RagService } from '../ai/rag.service';

type WidgetHeaders = { origin?: string; referer?: string };

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService, private readonly rag: RagService) {}

  async getWidgetConfig(embedKey: string, headers: WidgetHeaders) {
    const widget = await this.prisma.chatWidget.findUniqueOrThrow({
      where: { embedKey },
      include: { organization: { include: { aiPersona: true } } },
    });
    this.assertAllowedDomain(widget.allowedDomains, headers);
    return {
      embedKey,
      primaryColor: widget.primaryColor,
      greetingEN: widget.organization.aiPersona?.greetingEN ?? widget.greetingEN,
      greetingFR: widget.organization.aiPersona?.greetingFR ?? widget.greetingFR,
      requireConsent: widget.requireConsent,
      requireEmail: widget.requireEmail,
      requireName: widget.requireName,
    };
  }

  async startWidgetContact(embedKey: string, input: { name?: string; email?: string; language?: Language; pipedaConsent: boolean }, headers: WidgetHeaders) {
    if (!input.pipedaConsent) throw new BadRequestException('PIPEDA consent is required before chat starts');
    const widget = await this.prisma.chatWidget.findUniqueOrThrow({ where: { embedKey } });
    this.assertAllowedDomain(widget.allowedDomains, headers);
    const normalized = { ...input, name: input.name?.trim(), email: input.email?.trim().toLowerCase() };
    if (widget.requireName && !normalized.name) throw new BadRequestException('Name is required before chat starts');
    if (widget.requireEmail && !normalized.email) throw new BadRequestException('Email is required before chat starts');
    const customer = await this.findOrCreateWidgetCustomer(widget.organizationId, normalized);
    return this.prisma.contact.create({
      data: {
        organizationId: widget.organizationId,
        customerId: customer.id,
        channel: Channel.CHAT,
        status: ContactStatus.AI_ACTIVE,
        language: input.language ?? 'EN',
        answeredAt: new Date(),
      },
    });
  }

  async receiveWidgetMessage(contactId: string, content: string) {
    if (!content.trim()) throw new BadRequestException('Message content is required');
    const contact = await this.prisma.contact.findUniqueOrThrow({
      where: { id: contactId },
      include: { customer: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!contact.customer?.pipedaConsent) throw new BadRequestException('PIPEDA consent missing');
    const customerMessage = await this.prisma.message.create({ data: { contactId, senderType: 'CUSTOMER', content } });
    if (contact.status !== ContactStatus.AI_ACTIVE) {
      return { answer: 'A specialist has been notified and will continue the conversation.', status: contact.status };
    }
    const ai = await this.rag.chat({
      organizationId: contact.organizationId,
      query: content,
      language: contact.language,
      contactHistory: [...contact.messages, customerMessage],
      customerId: contact.customerId ?? undefined,
      contactId,
      aiTurns: contact.aiTurns,
    });
    await this.prisma.message.create({ data: { contactId, senderType: 'AI', content: ai.answer, aiConfidence: ai.confidence, retrievedChunks: ai.chunks } });
    await this.prisma.contact.update({
      where: { id: contactId },
      data: {
        aiTurns: { increment: 1 },
        intent: this.toIntentCategory(ai.intent),
        intentConfidence: ai.intentConfidence,
        ...(ai.shouldEscalate
          ? { status: ContactStatus.ESCALATED, escalated: true, escalationReason: (ai.escalationReason ?? 'LOW_CONFIDENCE') as const, escalatedAt: new Date(), aiSummary: ai.handoffSummary }
          : {}),
      },
    });
    return { answer: ai.answer };
  }

  private async findOrCreateWidgetCustomer(organizationId: string, input: { name?: string; email?: string; language?: Language }) {
    const email = input.email?.trim().toLowerCase();
    const name = input.name?.trim();
    if (!email) {
      return this.prisma.customer.create({
        data: { organizationId, firstName: name, language: input.language ?? 'EN', pipedaConsent: true, consentAt: new Date() },
      });
    }
    return this.prisma.customer.upsert({
      where: { organizationId_email: { organizationId, email } },
      create: { organizationId, email, firstName: name, language: input.language ?? 'EN', pipedaConsent: true, consentAt: new Date() },
      update: { firstName: name, language: input.language ?? 'EN', pipedaConsent: true, consentAt: new Date() },
    });
  }

  private toIntentCategory(intent?: string) {
    return Object.values(IntentCategory).includes(intent as IntentCategory) ? (intent as IntentCategory) : IntentCategory.OTHER;
  }

  private assertAllowedDomain(allowedDomains: string[], headers: WidgetHeaders) {
    if (allowedDomains.length === 0) return;
    const candidate = headers.origin ?? headers.referer;
    if (!candidate) throw new ForbiddenException('Widget origin is required');
    let hostname: string;
    try {
      hostname = new URL(candidate).hostname;
    } catch {
      throw new ForbiddenException('Widget origin is invalid');
    }
    const allowed = allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    if (!allowed) throw new ForbiddenException('Widget origin is not allowed for this embed key');
  }
}
