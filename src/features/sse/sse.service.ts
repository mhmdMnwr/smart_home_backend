import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { MqttService } from '../mqtt/mqtt.service.js';

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

const SENSOR_TOPICS = [
  'smartHome/devices/dht11/temperature/state',
  'smartHome/devices/dht11/humidity/state',
  'smartHome/devices/mq2/gas/state',
  'smartHome/devices/fireSensor/fire/state',
] as const;

const WEATHER_TOPICS = [
  'smartHome/weather/water/state',
  'smartHome/weather/light/state',
  'smartHome/weather/temperature/state',
  'smartHome/weather/humidity/state',
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

  constructor(private readonly mqttService: MqttService) {}

  /* ---- lifecycle ------------------------------------------------- */

  onModuleInit() {
    const client = this.mqttService.getClient();

    const allTopics = [
      ...ACTUATOR_TOPICS,
      ...SENSOR_TOPICS,
      ...WEATHER_TOPICS,
    ];

    // Subscribe to every topic once the client is connected.
    const subscribe = () => {
      client.subscribe(allTopics as unknown as string[], { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`SSE subscription error: ${err.message}`);
        } else {
          this.logger.log(
            `SSE subscribed to ${allTopics.length} topics`,
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

    // Route incoming messages to the correct Subject.
    client.on('message', (topic: string, payload: Buffer) => {
      const msg: SseMessage = {
        topic,
        payload: this.safeParse(payload),
        timestamp: new Date().toISOString(),
      };

      if ((ACTUATOR_TOPICS as readonly string[]).includes(topic)) {
        this.actuators$.next(msg);
      } else if ((SENSOR_TOPICS as readonly string[]).includes(topic)) {
        this.sensors$.next(msg);
      } else if ((WEATHER_TOPICS as readonly string[]).includes(topic)) {
        this.weather$.next(msg);
      }
    });
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
