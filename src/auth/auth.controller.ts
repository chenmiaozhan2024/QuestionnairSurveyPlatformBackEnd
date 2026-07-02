import { Controller, Post, Body, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RespMsg } from 'src/common/decorators/resp.msg.decorator';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from './decorators/public.decorator';
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // 用户登录功能
  @Public()
  @Post('user/login')
  @RespMsg('登录成功')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log('执行了用户登录');

    return {
      msg: result.msg,
      userRole: result.userRole,
      accessToken: result.accessToken,
    };
  }
  // 重新获取长token
  @Public()
  @Post('refresh')
  @RespMsg('令牌刷新成功')
  async arefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log('执行了获取令牌');
    return { accessToken: result.accessToken };
  }
  @Public()
  @Post('regist')
  @RespMsg('注册成功')
  registration(@Body() dto: LoginDto) {
    // console.log(regBoady);
    return this.authService.regist(dto);
  }
}
