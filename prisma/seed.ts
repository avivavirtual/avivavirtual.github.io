import { randomUUID } from 'node:crypto';
import { ArticleStatus, Channel, ContactStatus, KnowledgeBaseArticle, PrismaClient, Role, TicketPriority, TicketStatus, TranscriptionStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function user(email: string, password: string, firstName: string, lastName: string, role: Role, organizationId?: string) {
  return prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, role, organizationId },
    create: { email, passwordHash: await hash(password, 12), firstName, lastName, role, organizationId },
  });
}

async function article(organizationId: string, title: string, content: string, category: string) {
  const kbArticle = await prisma.knowledgeBaseArticle.upsert({
    where: { organizationId_title: { organizationId, title } },
    update: { content, status: ArticleStatus.APPROVED, tags: ['seed'], category, publishedAt: new Date() },
    create: { organizationId, title, content, status: ArticleStatus.APPROVED, tags: ['seed'], category, publishedAt: new Date() },
  });
  await seedArticleEmbedding(kbArticle);
  return kbArticle;
}

function deterministicEmbedding(text: string) {
  const vector = Array.from({ length: 1536 }, (_, index) => {
    const char = text.charCodeAt(index % text.length) || 1;
    return (((char * (index + 17)) % 2000) / 1000 - 1).toFixed(6);
  });
  return `[${vector.join(',')}]`;
}

async function seedArticleEmbedding(kbArticle: KnowledgeBaseArticle) {
  await prisma.embedding.deleteMany({ where: { articleId: kbArticle.id } });
  await prisma.$executeRaw`
    INSERT INTO "Embedding" (id, "organizationId", "articleId", "chunkIndex", "chunkText", "tokenCount", embedding, "createdAt")
    VALUES (${randomUUID()}, ${kbArticle.organizationId}, ${kbArticle.id}, 0, ${kbArticle.content}, ${kbArticle.content.split(/\s+/).length}, ${deterministicEmbedding(kbArticle.content)}::vector, NOW())
  `;
}

async function main() {
  const [superAdmin, ops, agent1, agent2, agent3] = await Promise.all([
    user('admin@avivavirtual.ca', 'SuperAdmin@123!', 'Super', 'Admin', Role.SUPER_ADMIN),
    user('ops@avivavirtual.ca', 'OpsManager@123!', 'Ops', 'Manager', Role.OPS_MANAGER),
    user('agent1@avivavirtual.ca', 'Agent@123!', 'Ava', 'Agent', Role.AGENT),
    user('agent2@avivavirtual.ca', 'Agent@123!', 'Noah', 'Agent', Role.AGENT),
    user('agent3@avivavirtual.ca', 'Agent@123!', 'Mila', 'Agent', Role.AGENT),
  ]);

  const rogers = await prisma.organization.upsert({ where: { slug: 'rogers' }, update: { name: 'Rogers Communications', industry: 'telecom', primaryColor: '#E1251B' }, create: { name: 'Rogers Communications', slug: 'rogers', industry: 'telecom', primaryColor: '#E1251B' } });
  const realty = await prisma.organization.upsert({ where: { slug: 'maple-leaf-realty' }, update: { name: 'Maple Leaf Realty', industry: 'realestate', primaryColor: '#0EA5E9' }, create: { name: 'Maple Leaf Realty', slug: 'maple-leaf-realty', industry: 'realestate', primaryColor: '#0EA5E9' } });
  await user('admin@rogers-demo.ca', 'ClientAdmin@123!', 'Rogers', 'Admin', Role.CLIENT_ADMIN, rogers.id);
  await user('admin@mapleleaf-demo.ca', 'ClientAdmin@123!', 'Maple', 'Admin', Role.CLIENT_ADMIN, realty.id);

  for (const [agent, org] of [[agent1, rogers], [agent2, rogers], [agent2, realty], [agent3, realty]] as const) {
    await prisma.agentClientAssignment.upsert({ where: { userId_organizationId: { userId: agent.id, organizationId: org.id } }, update: { assignedBy: superAdmin.id }, create: { userId: agent.id, organizationId: org.id, assignedBy: superAdmin.id } });
  }

  await prisma.aIPersona.upsert({ where: { organizationId: rogers.id }, update: { name: 'Aria' }, create: { organizationId: rogers.id, name: 'Aria', systemPromptEN: 'You are Aria, Rogers white-labelled bilingual support.', systemPromptFR: 'Vous êtes Aria, soutien bilingue en marque blanche pour Rogers.' } });
  await prisma.aISettings.upsert({ where: { organizationId: rogers.id }, update: { confidenceThreshold: 0.8, enableVoiceAI: true }, create: { organizationId: rogers.id, confidenceThreshold: 0.8, enableVoiceAI: true } });
  await prisma.sLAConfig.upsert({ where: { organizationId: rogers.id }, update: { urgentHours: 1, highHours: 4, mediumHours: 24, lowHours: 72 }, create: { organizationId: rogers.id, urgentHours: 1, highHours: 4, mediumHours: 24, lowHours: 72 } });
  await prisma.chatWidget.upsert({ where: { organizationId: rogers.id }, update: { primaryColor: '#E1251B', allowedDomains: ['rogers-demo.ca', 'localhost'] }, create: { organizationId: rogers.id, primaryColor: '#E1251B', allowedDomains: ['rogers-demo.ca', 'localhost'] } });
  await prisma.clientChannel.upsert({ where: { organizationId_type_identifier: { organizationId: rogers.id, type: Channel.VOICE, identifier: '4165550100' } }, update: { label: 'Main Support DID' }, create: { organizationId: rogers.id, type: Channel.VOICE, identifier: '4165550100', label: 'Main Support DID' } });

  await prisma.aIPersona.upsert({ where: { organizationId: realty.id }, update: { name: 'Alex' }, create: { organizationId: realty.id, name: 'Alex', systemPromptEN: 'You are Alex, Maple Leaf Realty support.', systemPromptFR: 'Vous êtes Alex, soutien Maple Leaf Realty.' } });
  await prisma.aISettings.upsert({ where: { organizationId: realty.id }, update: { confidenceThreshold: 0.7, enableVoiceAI: false }, create: { organizationId: realty.id, confidenceThreshold: 0.7, enableVoiceAI: false } });
  await prisma.chatWidget.upsert({ where: { organizationId: realty.id }, update: { allowedDomains: ['mapleleaf-demo.ca', 'localhost'] }, create: { organizationId: realty.id, allowedDomains: ['mapleleaf-demo.ca', 'localhost'] } });

  const rogersTopics = ['Billing cycles and payment arrangements', 'Mobile data plan changes', 'Roaming packages for US travel', 'Home internet troubleshooting', 'Modem restart procedure', 'CRTC complaint escalation', 'Account ownership changes', 'SIM swap safety', 'Device financing balances', 'French language support', 'Service outage checks', 'Callback scheduling policy', 'Cancellation retention policy', 'Accessibility support', 'Privacy and consent'];
  for (const [index, title] of rogersTopics.entries()) {
    await article(rogers.id, title, `${title}: Demo approved Rogers policy article ${index + 1}. Agents must validate account identity before discussing personal information.`, index % 2 ? 'technical' : 'billing');
  }

  const realtyTopics = ['Listing process overview', 'Buyer appointment booking', 'Rental application policy', 'Open house scheduling', 'Commission FAQ', 'Offer documentation', 'Condo status certificates', 'Move-in coordination'];
  for (const [index, title] of realtyTopics.entries()) {
    await article(realty.id, title, `${title}: Demo approved Maple Leaf Realty article ${index + 1}.`, 'faq');
  }

  const customer = await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: rogers.id, email: 'demo.customer@example.com' } },
    update: { firstName: 'Demo', lastName: 'Customer', pipedaConsent: true, consentAt: new Date() },
    create: { organizationId: rogers.id, email: 'demo.customer@example.com', firstName: 'Demo', lastName: 'Customer', pipedaConsent: true, consentAt: new Date() },
  });
  let contact = await prisma.contact.findFirst({ where: { organizationId: rogers.id, customerId: customer.id, aiSummary: 'Customer asked about roaming and needs account-specific confirmation.' } });
  contact ??= await prisma.contact.create({ data: { organizationId: rogers.id, customerId: customer.id, channel: Channel.CHAT, status: ContactStatus.ESCALATED, aiSummary: 'Customer asked about roaming and needs account-specific confirmation.', escalated: true } });
  await prisma.ticket.upsert({
    where: { organizationId_ticketNumber: { organizationId: rogers.id, ticketNumber: 'TKT-rogers-20260531-0001' } },
    update: { customerId: customer.id, contactId: contact.id, status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM },
    create: { organizationId: rogers.id, ticketNumber: 'TKT-rogers-20260531-0001', subject: 'Roaming billing clarification', description: 'Customer needs agent follow-up.', status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, customerId: customer.id, contactId: contact.id, createdById: ops.id },
  });
  await prisma.callRecord.upsert({
    where: { sipCallId: 'seed-rogers-roaming-001' },
    update: { contactId: contact.id, customerId: customer.id, transcriptionStatus: TranscriptionStatus.COMPLETED, transcription: 'Customer asked for help with roaming.', summary: 'Resolved with plan explanation.' },
    create: { organizationId: rogers.id, contactId: contact.id, customerId: customer.id, sipCallId: 'seed-rogers-roaming-001', direction: 'inbound', from: '+14165550199', to: '4165550100', billSeconds: 180, disposition: 'ANSWERED', transcriptionStatus: TranscriptionStatus.COMPLETED, transcription: 'Customer asked for help with roaming.', summary: 'Resolved with plan explanation.' },
  });
}

main().finally(async () => prisma.$disconnect());
