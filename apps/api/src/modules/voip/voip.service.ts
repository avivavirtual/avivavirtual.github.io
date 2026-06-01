import { createCipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class VoipService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionAgentCredentials(userId: string, username: string, rawPassword: string) {
    return this.prisma.agentSipCredentials.upsert({
      where: { userId },
      create: { userId, sipUsername: username, subAccount: `${process.env.VOIPMS_ACCOUNT}_${username}`, sipPassword: this.encrypt(rawPassword) },
      update: { sipUsername: username, sipPassword: this.encrypt(rawPassword), isActive: true },
    });
  }

  private encrypt(value: string): string {
    const key = Buffer.from((process.env.ENCRYPTION_KEY ?? '').padEnd(64, '0').slice(0, 64), 'hex');
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  }
}
