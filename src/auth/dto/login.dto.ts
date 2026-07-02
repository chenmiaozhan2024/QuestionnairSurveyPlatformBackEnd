import { IsNotEmpty, IsString, Length } from 'class-validator';
export class LoginDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  username: string;
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(6, 20, { message: '密码长度为6-20位' })
  password: string;
}
