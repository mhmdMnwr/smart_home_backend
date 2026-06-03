import { IsMongoId, IsString } from 'class-validator';

export class AssignTagDto {
  @IsString()
  cardTag!: string;

  @IsMongoId()
  userId!: string;
}
