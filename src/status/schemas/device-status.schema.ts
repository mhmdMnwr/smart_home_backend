import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceStatusDocument = DeviceStatus & Document;

export enum DeviceAvailabilityStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Schema({ timestamps: true })
export class DeviceStatus {
  @Prop({ required: true, unique: true, trim: true })
  device!: string;

  @Prop({ required: true, enum: Object.values(DeviceAvailabilityStatus) })
  status!: DeviceAvailabilityStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const DeviceStatusSchema = SchemaFactory.createForClass(DeviceStatus);
