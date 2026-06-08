import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SetCommandDto } from './dto/set-command.dto';

@Controller('mqtt')
export class MqttController {
  constructor(private readonly mqttService: MqttService) { }

  @Post('setLed/lamp1')
  @HttpCode(200)
  setLamp1(@Body() setCommandDto: SetCommandDto) {
    return this.mqttService.setLamp1(setCommandDto.set);
  }

  @Post('setLed/lamp2')
  @HttpCode(200)
  setLamp2(@Body() setCommandDto: SetCommandDto) {
    return this.mqttService.setLamp2(setCommandDto.set);
  }

  @Post('setfan/fan1')
  @HttpCode(200)
  setFan1(@Body() setCommandDto: SetCommandDto) {
    return this.mqttService.setFan1(setCommandDto.set);
  }

  @Post('setfan/fan2')
  @HttpCode(200)
  setFan2(@Body() setCommandDto: SetCommandDto) {
    return this.mqttService.setFan2(setCommandDto.set);
  }

  @Post('setDoor')
  @HttpCode(200)
  setDoor(@Body() setCommandDto: SetCommandDto) {
    return this.mqttService.setDoor(setCommandDto.set);
  }


  @Post('setAlarm')
  @HttpCode(200)
  setAlarm(@Body() setCommandDto: SetCommandDto) {
    return this.mqttService.setAlarm(setCommandDto.set);
  }
  @Post('setTempTreshold')
  @HttpCode(200)
  setTempTreshold(@Body('value') value: number) {
    return this.mqttService.setTempTreshold(value);
  }
}