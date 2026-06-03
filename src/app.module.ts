import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './logger.middleware';
import { UserModule } from './features/users/users.module';
import { AuthModule } from './features/auth/auth.module';
import { HistoryModule } from './features/history/history.module';
import { StatusModule } from './features/status/status.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { MqttModule } from './features/mqtt/mqtt.module';
import { SseModule } from './features/sse/sse.module';
//import { LogModule } from './features/logs/log.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    HistoryModule,
    StatusModule,
    NotificationsModule,
    MqttModule,
    SseModule,
    //LogModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
