import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { AuthTokensResponse } from './interfaces/auth-response.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: UserLoginDto): Promise<AuthTokensResponse> {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string): Promise<AuthTokensResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refreshToken(refreshToken);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
