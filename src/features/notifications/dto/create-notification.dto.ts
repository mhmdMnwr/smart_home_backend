import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsBoolean()
  @IsOptional()
  isread?: boolean;
}
