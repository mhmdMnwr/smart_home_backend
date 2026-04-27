import { IsEnum } from 'class-validator';

export enum SetCommand {
  ON = 'on',
  OFF = 'off',
}

export class SetCommandDto {
  @IsEnum(SetCommand, {
    message: 'set must be either "on" or "off"',
  })
  set!: SetCommand;
}