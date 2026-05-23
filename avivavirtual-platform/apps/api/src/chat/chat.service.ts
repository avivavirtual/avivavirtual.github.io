import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, type Content } from '@google/genai';
import { ChannelType, ConversationStatusType, LanguageType, SenderType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SendChatMessageDto, StartChatDto } from './dto/chat.dto';

type ChatHistoryMessage = {
  senderType: SenderType;
  content: string;
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private geminiClient?: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async start(dto: StartChatDto) {
    const message = this.normalizeMessage(dto.message);
    const organization = await this.getDemoOrganization();
    const customer = await this.findOrCreateCustomer(dto.name, dto.email, organization.id);
    const assistantReply = await this.generateAssistantReply(
      [{ senderType: SenderType.CUSTOMER, content: message }],
      customer.name,
      organization.name
    );

    const conversation = await this.prisma.conversation.create({
      data: {
        customerId: customer.id,
        organizationId: organization.id,
        status: ConversationStatusType.OPEN,
        channel: ChannelType.CHAT,
        language: LanguageType.EN,
        messages: {
          create: [
            {
              senderType: SenderType.CUSTOMER,
              content: message,
              isAI: false
            },
            this.createAssistantReply(assistantReply.content, assistantReply.confidenceScore)
          ]
        }
      },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    return conversation;
  }

  async sendMessage(conversationId: string, dto: SendChatMessageDto) {
    const message = this.normalizeMessage(dto.message);
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        organization: true,
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const assistantReply = await this.generateAssistantReply(
      [...conversation.messages, { senderType: SenderType.CUSTOMER, content: message }],
      conversation.customer.name,
      conversation.organization.name
    );

    await this.prisma.message.createMany({
      data: [
        {
          conversationId,
          senderType: SenderType.CUSTOMER,
          content: message,
          isAI: false
        },
        {
          conversationId,
          ...this.createAssistantReply(assistantReply.content, assistantReply.confidenceScore)
        }
      ]
    });

    return this.getConversation(conversationId);
  }

  async getConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async getDemoOrganization() {
    const existingOrganization = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (existingOrganization) {
      return existingOrganization;
    }

    return this.prisma.organization.create({
      data: {
        name: 'Demo Business',
        brandColor: '#117a7a'
      }
    });
  }

  private async findOrCreateCustomer(name: string, email: string, organizationId: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        email: normalizedEmail,
        organizationId
      }
    });

    if (existingCustomer) {
      return existingCustomer;
    }

    return this.prisma.customer.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        organizationId
      }
    });
  }

  private normalizeMessage(message: string) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      throw new BadRequestException('Message is required');
    }

    return trimmedMessage;
  }

  private createAssistantReply(content: string, confidenceScore: number) {
    return {
      senderType: SenderType.SYSTEM,
      content,
      isAI: true,
      confidenceScore
    };
  }

  private async generateAssistantReply(history: ChatHistoryMessage[], customerName: string, organizationName: string) {
    const latestMessage = history[history.length - 1]?.content ?? '';
    const gemini = this.getGeminiClient();

    if (!gemini) {
      return {
        content: this.buildFallbackReply(latestMessage),
        confidenceScore: 0.55
      };
    }

    try {
      const response = await gemini.models.generateContent({
        model: this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash',
        contents: this.buildGeminiContents(history),
        config: {
          systemInstruction: this.buildAssistantInstructions(customerName, organizationName),
          maxOutputTokens: 450,
          temperature: 0.4
        }
      });
      const content = response.text?.trim();

      if (!content) {
        return {
          content: this.buildFallbackReply(latestMessage),
          confidenceScore: 0.55
        };
      }

      return {
        content,
        confidenceScore: 0.92
      };
    } catch (error) {
      this.logger.warn(`Gemini chat response failed: ${error instanceof Error ? error.message : String(error)}`);

      return {
        content: this.buildFallbackReply(latestMessage),
        confidenceScore: 0.55
      };
    }
  }

  private buildGeminiContents(history: ChatHistoryMessage[]): Content[] {
    return history.slice(-12).map((message) => ({
      role: message.senderType === SenderType.CUSTOMER ? 'user' : 'model',
      parts: [{ text: message.content }]
    }));
  }

  private buildAssistantInstructions(customerName: string, organizationName: string) {
    return [
      `You are Avivavirtual's AI customer support assistant for ${organizationName}.`,
      `The customer name is ${customerName}.`,
      'Answer like a capable support agent: clear, specific, friendly, and useful.',
      'Use the conversation history so follow-up messages feel connected.',
      'If the customer asks a general how-to question, give practical steps.',
      'If account-specific data or a secure action is required, explain what information is needed and say a human agent can verify it.',
      'Do not pretend you already changed passwords, invoices, billing data, or account settings.',
      'Keep replies concise, usually 2 to 6 short sentences.'
    ].join('\n');
  }

  private getGeminiClient() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!this.isUsableGeminiKey(apiKey)) {
      return undefined;
    }

    this.geminiClient ??= new GoogleGenAI({ apiKey });
    return this.geminiClient;
  }

  private isUsableGeminiKey(apiKey?: string) {
    return Boolean(apiKey?.trim() && !apiKey.includes('change_this') && !apiKey.includes('your_gemini_api_key'));
  }

  private buildFallbackReply(message: string) {
    const lowerMessage = message.toLowerCase();

    if (this.messageIncludesAny(lowerMessage, ['invoice', 'billing', 'bill', 'receipt', 'payment'])) {
      return 'I can help with that. In most billing systems, invoices are reissued or corrected rather than reset. Please share the invoice number, the billing email, and what needs to change, and a support agent can verify the account before making the billing update.';
    }

    if (
      this.messageIncludesAny(lowerMessage, [
        'password',
        'login',
        'log in',
        'logging in',
        'sign in',
        'signin',
        'locked out',
        'account access'
      ])
    ) {
      return 'I can help with login trouble. First, try the password reset link from the sign-in page, then check your inbox and spam folder for the reset email. If you still cannot get in, send the email on the account and the exact error you see so an agent can verify the account securely.';
    }

    if (this.messageIncludesAny(lowerMessage, ['agent', 'human', 'person', 'representative'])) {
      return 'I will keep this conversation open for an agent. Please add any details that would help them understand the issue quickly.';
    }

    return 'Thanks for the details. I saved your message and started a support conversation. An agent can review it, and I can keep collecting more information here.';
  }

  private messageIncludesAny(message: string, phrases: string[]) {
    return phrases.some((phrase) => message.includes(phrase));
  }
}
