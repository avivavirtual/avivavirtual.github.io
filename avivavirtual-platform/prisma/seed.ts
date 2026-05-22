import {
  AgentAvailabilityType,
  ChannelType,
  ConversationStatusType,
  KnowledgeBaseStatusType,
  LanguageType,
  PlanType,
  PrismaClient,
  Role,
  TicketPriorityType,
  TicketStatusType,
  UserStatusType
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Business',
      plan: PlanType.GROWTH,
      brandColor: '#327fff'
    }
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@avivavirtual.ca',
      passwordHash: 'hashed_password_super_admin',
      role: Role.SUPER_ADMIN,
      status: UserStatusType.ACTIVE
    }
  });

  const [agent1, agent2] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'agent1@demo-business.ca',
        passwordHash: 'hashed_password_agent_1',
        role: Role.AGENT,
        organizationId: org.id,
        status: UserStatusType.ACTIVE
      }
    }),
    prisma.user.create({
      data: {
        email: 'agent2@demo-business.ca',
        passwordHash: 'hashed_password_agent_2',
        role: Role.AGENT,
        organizationId: org.id,
        status: UserStatusType.ACTIVE
      }
    })
  ]);

  await prisma.agentStatus.createMany({
    data: [
      { agentId: agent1.id, status: AgentAvailabilityType.AVAILABLE },
      { agentId: agent2.id, status: AgentAvailabilityType.BUSY }
    ]
  });

  const customers = await Promise.all(
    ['Alice Martin', 'Bob Singh', 'Claire Tremblay'].map((name, i) =>
      prisma.customer.create({
        data: {
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.ca`,
          phone: `+1514555000${i + 1}`,
          organizationId: org.id
        }
      })
    )
  );

  const kbArticles = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.knowledgeBaseArticle.create({
        data: {
          organizationId: org.id,
          title: `Demo KB Article #${i + 1}`,
          content: `This is seeded knowledge base content for article ${i + 1}.`,
          status: KnowledgeBaseStatusType.APPROVED,
          tags: ['billing', 'support', i % 2 === 0 ? 'en' : 'fr'],
          version: 1
        }
      })
    )
  );

  const conversations = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.conversation.create({
        data: {
          customerId: customers[i % customers.length].id,
          organizationId: org.id,
          status: i < 2 ? ConversationStatusType.CLOSED : ConversationStatusType.OPEN,
          channel: i % 3 === 0 ? ChannelType.CHAT : ChannelType.EMAIL,
          assignedAgentId: i % 2 === 0 ? agent1.id : agent2.id,
          language: i % 2 === 0 ? LanguageType.EN : LanguageType.FR,
          closedAt: i < 2 ? new Date() : null
        }
      })
    )
  );

  await prisma.message.createMany({
    data: conversations.flatMap((conversation, i) => [
      {
        conversationId: conversation.id,
        senderType: 'CUSTOMER',
        content: `Customer message ${i + 1}`,
        isAI: false,
        confidenceScore: null
      },
      {
        conversationId: conversation.id,
        senderType: 'AGENT',
        content: `Agent reply ${i + 1}`,
        isAI: i % 2 === 0,
        confidenceScore: i % 2 === 0 ? 0.78 : null
      }
    ])
  });

  const tickets = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.ticket.create({
        data: {
          organizationId: org.id,
          customerId: customers[i % customers.length].id,
          assignedAgentId: i % 2 === 0 ? agent1.id : agent2.id,
          title: `Support Ticket #${i + 1}`,
          description: `Seeded ticket description ${i + 1}`,
          priority: [
            TicketPriorityType.LOW,
            TicketPriorityType.MEDIUM,
            TicketPriorityType.HIGH,
            TicketPriorityType.URGENT
          ][i % 4],
          status: [
            TicketStatusType.NEW,
            TicketStatusType.OPEN,
            TicketStatusType.PENDING,
            TicketStatusType.RESOLVED,
            TicketStatusType.CLOSED
          ][i % 5],
          slaDeadline: new Date(Date.now() + (i + 1) * 60 * 60 * 1000)
        }
      })
    )
  );

  await prisma.ticketComment.createMany({
    data: tickets.slice(0, 5).map((ticket, i) => ({
      ticketId: ticket.id,
      authorId: i % 2 === 0 ? agent1.id : agent2.id,
      content: `Internal note for ticket ${ticket.id}`,
      isInternal: true
    }))
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: agent1.id,
        action: 'ANALYTICS_CONVERSATION_CREATED',
        resource: 'Conversation',
        metadata: { count: conversations.length }
      },
      {
        organizationId: org.id,
        userId: agent2.id,
        action: 'ANALYTICS_TICKET_CREATED',
        resource: 'Ticket',
        metadata: { count: tickets.length }
      },
      {
        organizationId: org.id,
        userId: superAdmin.id,
        action: 'ANALYTICS_KB_ARTICLES_CREATED',
        resource: 'KnowledgeBaseArticle',
        metadata: { count: kbArticles.length }
      }
    ]
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
