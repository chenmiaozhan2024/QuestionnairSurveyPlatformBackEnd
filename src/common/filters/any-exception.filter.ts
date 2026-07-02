import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // HttpException交给上面过滤器处理
    if (exception instanceof HttpException) return;

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    console.error('【服务器未知异常】', exception);

    res.status(HttpStatus.OK).json({
      code: 0,
      msg: '服务器内部错误',
      data: null,
    });
  }
}
