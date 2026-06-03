import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Delete,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { AssignTagDto } from './dto/assign-tag.dto';
import { CreateUserDto } from './dto/create_dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type JwtRequest = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: JwtRequest) {
    return this.usersService.getMe(req.user.sub);
  }

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post('verify-tag')
  @HttpCode(200)
  verifyTag(@Body('cardTag') cardTag: string) {
    return this.usersService.verifyTag(cardTag);
  }

  @Post('assign-tag')
  assignTag(@Body() assignTagDto: AssignTagDto) {
    return this.usersService.assignTag(assignTagDto.userId, assignTagDto.cardTag);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Patch('me')
  updateMe(@Req() req: JwtRequest, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.sub, updateUserDto);
  }

  @Patch(':id')
  updateByAdmin(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserById(id, updateUserDto);
  }

  @Delete(':id')
  deleteByAdmin(@Param('id') id: string) {
    return this.usersService.deleteUserById(id);
  }
}