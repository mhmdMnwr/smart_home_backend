import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create_dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    await this.userModel.updateOne({ email }, { password: hashedPassword }).exec();
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      const createdUser = await this.userModel.create({
        ...createUserDto,
        password: hashedPassword,
        role: createUserDto.role ?? UserRole.USER,
      });

      return this.excludePassword(createdUser);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email already in use');
      }

      throw error;
    }
  }

  async updateMe(userId: string, updateUserDto: UpdateUserDto) {
    return this.updateUserById(userId, updateUserDto);
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.excludePassword(user);
  }

  async updateUserById(userId: string, updateUserDto: UpdateUserDto) {
    const updatePayload: Partial<User> & { password?: string } = {};

    if (typeof updateUserDto.name !== 'undefined') {
      updatePayload.name = updateUserDto.name;
    }

    if (typeof updateUserDto.email !== 'undefined') {
      updatePayload.email = updateUserDto.email;
    }

    if (typeof updateUserDto.phoneNumber !== 'undefined') {
      updatePayload.phoneNumber = updateUserDto.phoneNumber;
    }

    if (typeof updateUserDto.password !== 'undefined') {
      updatePayload.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (Object.keys(updatePayload).length === 0) {
      const existingUser = await this.userModel.findById(userId).exec();

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      return this.excludePassword(existingUser);
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, updatePayload, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      return this.excludePassword(updatedUser);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email already in use');
      }

      throw error;
    }
  }

  private excludePassword(user: UserDocument) {
    const { password, ...safeUser } = user.toObject();
    return safeUser;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    return (
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'number' &&
      (error as { code: number }).code === 11000
    );
  }
}
