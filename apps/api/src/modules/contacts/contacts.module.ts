import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({ imports: [AiModule, AuthModule], controllers: [ContactsController], providers: [ContactsService], exports: [ContactsService] })
export class ContactsModule {}
