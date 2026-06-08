import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, IClientOptions, MqttClient } from 'mqtt';
import { SetCommand } from './dto/set-command.dto';

const SMART_HOME_TOPICS = {
  lamp1Set: 'smartHome/devices/lamp/lamp1/set',
  lamp2Set: 'smartHome/devices/lamp/lamp2/set',
  fan1Set: 'smartHome/devices/fan/fan1/set',
  fan2Set: 'smartHome/devices/fan/fan2/set',
  openDoor: 'smartHome/devices/door/opendoor',
  setAlarm: 'smartHome/devices/alarm/set',
  changePassword: 'smartHome/devices/door/changePassword',
  TempTreshOld: 'smartHome/devices/dht11/temperature/set'
} as const;

@Injectable()
export class MqttService implements OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private readonly client: MqttClient;

  constructor(private readonly configService: ConfigService) {
    const brokerUrl =
      this.configService.get<string>('MQTT_BROKER_URL') ??
      'mqtt://10.33.137.110:1883';

    const options: IClientOptions = {
      reconnectPeriod: 1000,
      connectTimeout: 5000,
    };

    const username = this.configService.get<string>('MQTT_USERNAME');
    const password = this.configService.get<string>('MQTT_PASSWORD');

    if (username) {
      options.username = username;
    }

    if (password) {
      options.password = password;
    }



    this.client = connect(brokerUrl, options);

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker at ${brokerUrl}`);
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT error: ${error.message}`);
    });
  }

  onModuleDestroy() {
    this.client.end(true);
  }

  async setLamp1(set: SetCommand) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.lamp1Set,
      { set },
      'Lamp 1 command published',
    );
  }

  async setLamp2(set: SetCommand) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.lamp2Set,
      { set },
      'Lamp 2 command published',
    );
  }

  async setFan1(set: SetCommand) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.fan1Set,
      { set },
      'Fan 1 command published',
    );
  }

  async setFan2(set: SetCommand) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.fan2Set,
      { set },
      'Fan 2 command published',
    );
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.changePassword,
      { oldPassword, newPassword },
      'Password change command published',
    );
  }

  async openDoor(password: string) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.openDoor,
      { password },
      'Door open command published',
    );
  }

  async setTempTreshold(value: number) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.TempTreshOld,
      { value },
      'Temperature threshold command published',
    );
  }

  async setAlarm(set: SetCommand) {
    return this.publishToTopic(
      SMART_HOME_TOPICS.setAlarm,
      { set },
      'Alarm command published',
    );
  }




  private publishToTopic<TPayload extends Record<string, unknown>>(
    topic: string,
    payload: TPayload,
    successMessage = 'MQTT message published',
  ) {
    const message = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          return reject(
            new InternalServerErrorException(
              `Failed to publish MQTT message: ${error.message}`,
            ),
          );
        }

        return resolve({
          message: successMessage,
        });
      });
    });
  }
}