import { createCipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class VoipService {
  private readonly encryptionKey: Buffer;

  constructor(private readonly prisma: PrismaService) {
    this.encryptionKey = this.requireEncryptionKey();
  }

  async provisionAgentCredentials(userId: string, username: string, rawPassword: string) {
    return this.prisma.agentSipCredentials.upsert({
      where: { userId },
      create: { userId, sipUsername: username, subAccount: `${process.env.VOIPMS_ACCOUNT}_${username}`, sipPassword: this.encrypt(rawPassword) },
      update: { sipUsername: username, sipPassword: this.encrypt(rawPassword), isActive: true },
    });
  }

  private requireEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || !/^[0-9a-f]{64}$/i.test(key)) throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters');
    return Buffer.from(key, 'hex');
  }

  private encrypt(value: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  }
}
