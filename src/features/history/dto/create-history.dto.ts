import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateHistoryDto {
  @IsString()
  @IsNotEmpty()
  device!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsNumber()
  @IsNotEmpty()
  value!: number;
}
