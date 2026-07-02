import { SetMetadata } from '@nestjs/common';
import { RESPONSE_MSG_KEY } from '../interceptors/transform/interceptor';

/**
 * 自定义接口成功提示
 * @param text 提示文字
 */
export const RespMsg = (text: string) => SetMetadata(RESPONSE_MSG_KEY, text);
