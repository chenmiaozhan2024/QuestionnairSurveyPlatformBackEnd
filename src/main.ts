import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform/interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AnyExceptionFilter } from './common/filters/any-exception.filter';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  //设置全局统一响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  //全局异常过滤器
  app.useGlobalFilters(new AnyExceptionFilter(), new HttpExceptionFilter());
  const config = app.get(ConfigService);
  // 全局 JWT 守卫
  app.useGlobalGuards(new JwtAuthGuard(app.get(JwtService), config, reflector));
  app.use(cookieParser());
  //开启跨域
  app.enableCors();
  //设置端口
  await app.listen(process.env.PORT ?? 3001);
  // console.log(config.get('JWT_ACCESS_SECRET'));
  // console.log(process.env.JWT_ACCESS_SECRET);
}

bootstrap();
