import { Controller, Logger, MessageEvent, Sse } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { SseService, SseMessage } from './sse.service.js';

@Controller('sse')
export class SseController {
  private readonly logger = new Logger(SseController.name);

  constructor(private readonly sseService: SseService) {}

  /* ---------------------------------------------------------------- */
  /*  GET /sse/actuators                                              */
  /* ---------------------------------------------------------------- */
  @Sse('actuators')
  actuators(): Observable<MessageEvent> {
    this.logger.log('Client connected to /sse/actuators');
    return this.sseService.getActuatorStream().pipe(
      map((msg: SseMessage) => this.toMessageEvent(msg)),
    );
  }

  /* ---------------------------------------------------------------- */
  /*  GET /sse/sensors                                                */
  /* ---------------------------------------------------------------- */
  @Sse('sensors')
  sensors(): Observable<MessageEvent> {
    this.logger.log('Client connected to /sse/sensors');
    return this.sseService.getSensorStream().pipe(
      map((msg: SseMessage) => this.toMessageEvent(msg)),
    );
  }

  /* ---------------------------------------------------------------- */
  /*  GET /sse/weather                                                */
  /* ---------------------------------------------------------------- */
  @Sse('weather')
  weather(): Observable<MessageEvent> {
    this.logger.log('Client connected to /sse/weather');
    return this.sseService.getWeatherStream().pipe(
      map((msg: SseMessage) => this.toMessageEvent(msg)),
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Helper                                                          */
  /* ---------------------------------------------------------------- */
  private toMessageEvent(msg: SseMessage): MessageEvent {
    return {
      data: msg,
    };
  }
}
