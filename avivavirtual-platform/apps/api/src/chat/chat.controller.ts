import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ChatService } from './chat.service';
import { SendChatMessageDto, StartChatDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  start(@Body() dto: StartChatDto) {
    return this.chatService.start(dto);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) {
    return this.chatService.getConversation(id);
  }

  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendChatMessageDto) {
    return this.chatService.sendMessage(id, dto);
  }
}
