import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const errInfo = exception.getResponse();

    let msg = '请求失败';
    if (typeof errInfo === 'string') {
      msg = errInfo;
    } else if (typeof errInfo === 'object' && errInfo['message']) {
      // class-validator数组校验消息取第一条
      msg = Array.isArray(errInfo['message'])
        ? errInfo['message'][0]
        : errInfo['message'];
    }

    // 统一错误格式 code=0 data=null，保留真实 HTTP 状态码
    const status = exception.getStatus();
    res.status(status).json({
      code: 0,
      msg,
      data: null,
    });
  }
}
