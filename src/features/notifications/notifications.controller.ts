import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.notificationsService.findAll(+page, +limit);
  }

  @Get('unread-number')
  newNotificationsNumber() {
    return this.notificationsService.newNofificationsNumber();
  }

  @Post('markAsRead')
  markAsRead(@Body('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('markAllAsRead')
  markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }


}
