import {
  ForbiddenException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../../users/schemas/user.schema';

type RequestWithUser = Request & {
  user?: {
    role?: string;
  };
};

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: RequestWithUser, _res: Response, next: NextFunction) {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    next();
  }
}