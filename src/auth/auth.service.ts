import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import { BizException } from 'src/common/exceptions/biz.exception';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>, // ← 加这个
  ) {}
  // 生成长短token
  generateTokens(username: string) {
    // 短 token
    const accessToken = this.jwtService.sign(
      { sub: username },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES'),
      },
    );
    // 长 token
    const refreshToken = this.jwtService.sign(
      { sub: username },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES'),
      },
    );
    return { accessToken, refreshToken };
  }
  async login(dto: LoginDto) {
    //根据用户名查询，判断用户是否存在
    const user = await this.userModel.findOne({ username: dto.username });
    if (!user) {
      throw new BizException('用户不存在');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new BizException('密码错误');
    }
    const msg = user.userRole === '0' ? '超级管理员登录成功' : '普通管理员';
    // console.log(user);

    const { accessToken, refreshToken } = this.generateTokens(user.username);
    // 存入数据库，覆盖旧的 refreshToken
    user.refreshToken = refreshToken;
    await user.save();
    return { msg, userRole: user.userRole, accessToken, refreshToken };
  }

  // 刷新 token
  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      // 验证通过，生成新的双 token
      // 查数据库，对比传入的 token 是否与数据库一致
      const user = await this.userModel.findOne({ username: payload.sub });
      if (!user || user.refreshToken !== token) {
        throw new BizException('该账号已在其他设备登录，请重新登录');
      }
      // 生成新 token，覆盖数据库
      const tokens = this.generateTokens(payload.sub);
      user.refreshToken = tokens.refreshToken;
      await user.save();
      return tokens;
    } catch (err) {
      if (err instanceof BizException) throw err;
      throw new BizException('令牌已过期，请重新登录');
    }
  }
  async regist(dto: LoginDto) {
    const exist = await this.userModel.findOne({ username: dto.username });
    if (exist) {
      throw new BizException('用户名已存在');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    // 2. 创建用户
    const user = new this.userModel({
      id: uuidv4(),
      username: dto.username,
      password: hashedPassword, // 建议后续用 bcrypt.hash 加密
    });
    await user.save();
    // 3. 注册完直接返回（不自动登录，让用户自己去登录）
    return null;
  }
}
