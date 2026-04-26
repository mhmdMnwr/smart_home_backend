import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';
import { DeviceStatus, DeviceStatusSchema } from './schemas/device-status.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceStatus.name, schema: DeviceStatusSchema },
    ]),
  ],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
