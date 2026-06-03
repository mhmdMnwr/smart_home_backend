import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminMiddleware } from '../../common/middleware/admin.middleware';
import { JwtMiddleware } from '../../common/middleware/jwt.middleware';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'fallback_secret',
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude({ path: 'users/verify-tag', method: RequestMethod.POST })
      .forRoutes(UsersController);

    consumer.apply(AdminMiddleware).forRoutes(
      { path: 'users', method: RequestMethod.POST },
      { path: 'users/assign-tag', method: RequestMethod.POST },
      { path: 'users/:id', method: RequestMethod.PATCH },
      { path: 'users/:id', method: RequestMethod.DELETE },
    );
  }
}
