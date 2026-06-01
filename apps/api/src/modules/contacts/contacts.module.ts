import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({ imports: [AiModule], controllers: [ContactsController], providers: [ContactsService], exports: [ContactsService] })
export class ContactsModule {}
