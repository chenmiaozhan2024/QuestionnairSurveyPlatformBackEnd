import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform/interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AnyExceptionFilter } from './common/filters/any-exception.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const reflector = app.get(Reflector);
  //设置全局统一响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  //全局异常过滤器
  app.useGlobalFilters(new AnyExceptionFilter(), new HttpExceptionFilter());
  const config = app.get(ConfigService);
  // 全局 JWT 守卫
  app.useGlobalGuards(new JwtAuthGuard(app.get(JwtService), config, reflector));
  app.use(cookieParser());

  // 静态映射：访问 /static 对应项目根目录 public 文件夹
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/static', // 访问前缀
  });

  //开启跨域
  app.enableCors();
  //设置端口
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
