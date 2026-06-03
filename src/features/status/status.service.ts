import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DeviceStatus,
  DeviceStatusDocument,
} from './schemas/device-status.schema';
import { UpdateDeviceStatusDto } from './dto/update-device-status.dto';

@Injectable()
export class StatusService {
  private readonly trackedDevices = ['lamp1', 'lamp2', 'fan1', 'fan2', 'alarm', 'door'];
  private readonly trackedSensors = ['dht11', 'mq2'];

  constructor(
    @InjectModel(DeviceStatus.name)
    private readonly deviceStatusModel: Model<DeviceStatusDocument>,
  ) {}

  async getDevicesStatus() {
    const statuses = await this.deviceStatusModel
      .find({ device: { $in: this.trackedDevices } })
      .exec();

    const statusMap = new Map(statuses.map((item) => [item.device, item]));

    return {
      message: 'Devices status retrieved successfully',
      data: {
        lamp1: this.formatDeviceStatus(statusMap.get('lamp1')),
        lamp2: this.formatDeviceStatus(statusMap.get('lamp2')),
        fan1: this.formatDeviceStatus(statusMap.get('fan1')),
        fan2: this.formatDeviceStatus(statusMap.get('fan2')),
        alarm: this.formatDeviceStatus(statusMap.get('alarm')),
        door: this.formatDeviceStatus(statusMap.get('door')),
      },
    };
  }

  async getStatusByDevice(device: string) {
    const targetDevice = device.trim();

    const deviceStatus = await this.deviceStatusModel
      .findOne({ device: targetDevice })
      .exec();

    if (!deviceStatus) {
      throw new NotFoundException(`Device not found: ${targetDevice}`);
    }

    return {
      message: 'Device status retrieved successfully',
      data: {
        device: deviceStatus.device,
        status: deviceStatus.status,
        updatedAt: deviceStatus.updatedAt,
      },
    };
  }

  async getSensorsStatus() {
    const statuses = await this.deviceStatusModel
      .find({ device: { $in: this.trackedSensors } })
      .exec();

    const statusMap = new Map(statuses.map((item) => [item.device, item]));

    return {
      message: 'Sensors status retrieved successfully',
      data: {
        dht11: this.formatDeviceStatus(statusMap.get('dht11')),
        mq2: this.formatDeviceStatus(statusMap.get('mq2')),
      },
    };
  }

  async getStatusBySensor(sensor: string) {
    const targetSensor = sensor.trim();

    if (!this.trackedSensors.includes(targetSensor)) {
      throw new NotFoundException(`Sensor not found: ${targetSensor}`);
    }

    const sensorStatus = await this.deviceStatusModel
      .findOne({ device: targetSensor })
      .exec();

    if (!sensorStatus) {
      return {
        message: 'Sensor status retrieved successfully',
        data: {
          sensor: targetSensor,
          status: null,
          updatedAt: null,
        },
      };
    }

    return {
      message: 'Sensor status retrieved successfully',
      data: {
        sensor: sensorStatus.device,
        status: sensorStatus.status,
        updatedAt: sensorStatus.updatedAt,
      },
    };
  }

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

  private formatDeviceStatus(deviceStatus?: DeviceStatusDocument) {
    if (!deviceStatus) {
      return {
        status: null,
        updatedAt: null,
      };
    }

    return {
      status: deviceStatus.status,
      updatedAt: deviceStatus.updatedAt,
    };
  }
}
