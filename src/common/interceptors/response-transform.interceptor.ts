import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';

type SuccessResponse<T> = {
  statusCode: number;
  sucess: true;
  data: T;
};

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((rawData) => {
        if (this.isAlreadyFormatted(rawData)) {
          return rawData;
        }

        const data = this.extractData(rawData);

        return {
          statusCode: response.statusCode,
          sucess: true,
          data,
        };
      }),
    );
  }

  private extractData(rawData: unknown): unknown {
    if (!this.isObject(rawData)) {
      return rawData;
    }

    const record = rawData as Record<string, unknown>;

    if (!('message' in record)) {
      return rawData;
    }

    const keys = Object.keys(record);

    if (keys.length === 1) {
      return null;
    }

    if (keys.length === 2 && 'data' in record) {
      return record.data;
    }

    const { message: _message, ...rest } = record;

    return rest;
  }

  private isAlreadyFormatted(value: unknown): value is SuccessResponse<unknown> {
    if (!this.isObject(value)) {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      typeof record.statusCode === 'number' && typeof record.sucess === 'boolean'
    );
  }

  private isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null;
  }
}