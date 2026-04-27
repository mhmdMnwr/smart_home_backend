import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StatusService } from './status.service';
import { UpdateDeviceStatusDto } from './dto/update-device-status.dto';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get('devices')
  getDevicesStatus() {
    return this.statusService.getDevicesStatus();
  }

  @Get('device/:device')
  getByDevice(@Param('device') device: string) {
    return this.statusService.getStatusByDevice(device);
  }

  @Get('sensors')
  getSensorsStatus() {
    return this.statusService.getSensorsStatus();
  }

  @Get('sensor/:sensor')
  getBySensor(@Param('sensor') sensor: string) {
    return this.statusService.getStatusBySensor(sensor);
  }

  @Post('update')
  update(@Body() updateDeviceStatusDto: UpdateDeviceStatusDto) {
    return this.statusService.updateStatus(updateDeviceStatusDto);
  }
}
