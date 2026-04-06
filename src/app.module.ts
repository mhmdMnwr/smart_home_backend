import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './logger.middleware';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb+srv://mmameur:xkRLb7Q5iGeq3vp5@mnwrsdb.ejxrhdk.mongodb.net/mnwrtestdb?retryWrites=true&w=majority',
    ),
    UserModule,
    AuthModule,
    HistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
