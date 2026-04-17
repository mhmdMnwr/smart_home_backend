import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeviceStatus,
  DeviceStatusDocument,
} from './schemas/device-status.schema';
import { UpdateDeviceStatusDto } from './dto/update-device-status.dto';

@Injectable()
export class StatusService {
  constructor(
    @InjectModel(DeviceStatus.name)
    private readonly deviceStatusModel: Model<DeviceStatusDocument>,
  ) {}

  async updateStatus(updateDeviceStatusDto: UpdateDeviceStatusDto) {
    try {
      const updatedDevice = await this.deviceStatusModel
        .findOneAndUpdate(
          { device: updateDeviceStatusDto.device },
          {
            $set: { status: updateDeviceStatusDto.status },
            $setOnInsert: { device: updateDeviceStatusDto.device },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        )
        .exec();

      if (!updatedDevice) {
        throw new InternalServerErrorException(
          'An error occurred while updating device status',
        );
      }

      return {
        message: 'Device status updated successfully',
        data: {
          device: updatedDevice.device,
          status: updatedDevice.status,
          updatedAt: updatedDevice.updatedAt,
        },
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while updating device status',
      );
    }
  }
}
