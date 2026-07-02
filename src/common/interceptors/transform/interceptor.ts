import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

// metadata key
export const RESPONSE_MSG_KEY = 'response_msg';

// 固定返回结构
export interface ResultVO<T> {
  code: number;
  msg: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResultVO<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResultVO<T>> {
    // 获取接口自定义成功文案
    const customMsg = this.reflector.get<string>(
      RESPONSE_MSG_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        code: 1,
        msg: customMsg ?? '成功',
        data,
      })),
    );
  }
}
