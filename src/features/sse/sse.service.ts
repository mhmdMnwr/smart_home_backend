import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { MqttService } from '../mqtt/mqtt.service';

/* ------------------------------------------------------------------ */
/*  Topic definitions for each SSE stream                             */
/* ------------------------------------------------------------------ */

const ACTUATOR_TOPICS = [
  'smartHome/devices/lamp/lamp1/set',
  'smartHome/devices/lamp/lamp2/set',
  'smartHome/devices/fan/fan1/set',
  'smartHome/devices/fan/fan2/set',
  'smartHome/devices/door/opendoor',
  'smartHome/devices/alarm/set',
] as const;

/* ------------------------------------------------------------------ */
/*  Message type emitted by each SSE stream                           */
/* ------------------------------------------------------------------ */

export interface SseMessage {
  topic: string;
  payload: unknown;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Service                                                           */
/* ------------------------------------------------------------------ */

@Injectable()
export class SseService implements OnModuleInit {
  private readonly logger = new Logger(SseService.name);

  /** One Subject per stream – clients observe these via SSE. */
  private readonly actuators$ = new Subject<SseMessage>();
  private readonly sensors$ = new Subject<SseMessage>();
  private readonly weather$ = new Subject<SseMessage>();

  constructor(private readonly mqttService: MqttService) { }

  /* ---- lifecycle ------------------------------------------------- */

  onModuleInit() {
    const client = this.mqttService.getClient();

    // Only subscribe to actuator topics via MQTT.
    // Sensors and weather are pushed via public methods below.
    const subscribe = () => {
      client.subscribe(ACTUATOR_TOPICS as unknown as string[], { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`SSE subscription error: ${err.message}`);
        } else {
          this.logger.log(
            `SSE subscribed to ${ACTUATOR_TOPICS.length} actuator topics`,
          );
        }
      });
    };

    // If already connected, subscribe immediately; otherwise wait.
    if (client.connected) {
      subscribe();
    } else {
      client.on('connect', subscribe);
    }

    // Route incoming MQTT messages to actuators only.
    client.on('message', (topic: string, payload: Buffer) => {
      if ((ACTUATOR_TOPICS as readonly string[]).includes(topic)) {
        const msg: SseMessage = {
          topic,
          payload: this.safeParse(payload),
          timestamp: new Date().toISOString(),
        };
        this.actuators$.next(msg);
      }
    });
  }

  /* ---- public push methods for sensors & weather ----------------- */

  /** Push a sensor message into the SSE stream. */
  pushSensorMessage(topic: string, payload: unknown): void {
    const msg: SseMessage = {
      topic,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.sensors$.next(msg);
    this.logger.debug(`Sensor SSE pushed: ${topic}`);
  }

  /** Push a weather message into the SSE stream. */
  pushWeatherMessage(topic: string, payload: unknown): void {
    const msg: SseMessage = {
      topic,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.weather$.next(msg);
    this.logger.debug(`Weather SSE pushed: ${topic}`);
  }

  /* ---- public observables for the controller --------------------- */

  getActuatorStream(): Observable<SseMessage> {
    return this.actuators$.asObservable();
  }

  getSensorStream(): Observable<SseMessage> {
    return this.sensors$.asObservable();
  }

  getWeatherStream(): Observable<SseMessage> {
    return this.weather$.asObservable();
  }

  /* ---- helpers --------------------------------------------------- */

  private safeParse(buf: Buffer): unknown {
    const raw = buf.toString();
    try {
      return JSON.parse(raw);
    } catch {
      return raw; // Not JSON – return the raw string.
    }
  }
}
