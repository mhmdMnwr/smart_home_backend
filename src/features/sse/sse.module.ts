import { Module } from '@nestjs/common';
import { MqttModule } from '../mqtt/mqtt.module.js';
import { SseController } from './sse.controller.js';
import { SseService } from './sse.service.js';

@Module({
  imports: [MqttModule],
  controllers: [SseController],
  providers: [SseService],
})
export class SseModule {}
