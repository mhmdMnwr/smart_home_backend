import { IsNotEmpty, IsString } from 'class-validator';

export class OpenDoorDto {
  @IsString()
  @IsNotEmpty()
  password!: string;
}