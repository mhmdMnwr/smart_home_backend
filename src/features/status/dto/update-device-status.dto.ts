import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DeviceAvailabilityStatus } from '../schemas/device-status.schema';

export class UpdateDeviceStatusDto {
  @IsString()
  @IsNotEmpty()
  device!: string;

  @IsEnum(DeviceAvailabilityStatus)
  status!: DeviceAvailabilityStatus;
}
