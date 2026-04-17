import { Body, Controller, Post } from '@nestjs/common';
import { StatusService } from './status.service';
import { UpdateDeviceStatusDto } from './dto/update-device-status.dto';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post('update')
  update(@Body() updateDeviceStatusDto: UpdateDeviceStatusDto) {
    return this.statusService.updateStatus(updateDeviceStatusDto);
  }
}
