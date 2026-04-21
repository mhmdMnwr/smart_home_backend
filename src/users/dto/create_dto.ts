import {
	IsEmail,
	IsEnum,
	IsOptional,
	IsString,
	MinLength,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
	@IsString()
	name!: string;

	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	password!: string;

	@IsOptional()
	@IsString()
	phoneNumber?: string;

	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;
}
