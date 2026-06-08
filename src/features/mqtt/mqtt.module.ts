import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MqttController } from './mqtt.controller';
import { MqttService } from './mqtt.service';

@Module({
  imports: [ConfigModule],
  controllers: [MqttController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}