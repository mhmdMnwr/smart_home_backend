import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { AuthTokensResponse } from './interfaces/auth-response.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const { password, ...result } = user.toObject();
    return result;
  }

  async login(user: any): Promise<AuthTokensResponse> {
    const payload = { email: user.email, sub: String(user._id), role: user.role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '7d', // Long lived access token
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '30d', // Even longer lived refresh token
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }


  

  async resetPassword(resetDto: ResetPasswordDto) {
    const { email, previousPassword, newPassword } = resetDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    const isMatch = await bcrypt.compare(previousPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect previous password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(email, hashedPassword);
    return { message: 'Password reset successful' };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokensResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    } 

  }
}
