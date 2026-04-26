import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    try {
      const createdNotification = new this.notificationModel({
        ...createNotificationDto,
        isread: createNotificationDto.isread ?? false,
      });

      await createdNotification.save();

      return {
        message: 'Notification created successfully',
        data: {
          id: createdNotification.id,
          message: createdNotification.message,
          type: createdNotification.type,
          isread: createdNotification.isread,
          createdAt: createdNotification.createdAt,
        },
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while creating notification',
      );
    }
  }

  async findAll(page: number, limit: number) {
    try {
      const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;
      const normalizedLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (normalizedPage - 1) * normalizedLimit;

      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(normalizedLimit)
          .exec(),
        this.notificationModel.countDocuments().exec(),
      ]);

      return {
        data: notifications.map((notification) => ({
          id: notification.id,
          message: notification.message,
          type: notification.type,
          isread: notification.isread,
          createdAt: notification.createdAt,
        })),
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.ceil(total / normalizedLimit),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while retrieving notifications',
      );
    }
  }

  async markAsRead(id: string) {
    try {
      const updatedNotification = await this.notificationModel
        .findByIdAndUpdate(
          id,
          { isread: true },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedNotification) {
        return {
          message: 'Notification not found',
        };
      }

      return {
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while marking notification as read',
      );
    }
  }

  async markAllAsRead() {
    try {
      await this.notificationModel.updateMany({ isread: false }, { isread: true }).exec();

      return {
        message: 'All notifications marked as read',
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while marking all notifications as read',
      );
    }
  }

  async newNofificationsNumber(){
    try {
      const count = await this.notificationModel.countDocuments({ isread: false }).exec();
      return { newNotifications: count };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while counting new notifications',
      );
    }
  }
}
