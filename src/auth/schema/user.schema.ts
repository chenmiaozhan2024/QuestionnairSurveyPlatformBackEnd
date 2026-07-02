import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true }) // 自动生成 createdAt updatedAt
export class User {
  @Prop({ required: true, unique: true, comment: '用户id' })
  id: string;
  @Prop({ required: true, unique: true, comment: '登录账号' })
  username: string;

  @Prop({ required: true, comment: '密码' })
  password: string;

  @Prop({ default: '0', comment: '用户角色 0=超级管理员' })
  userRole: string;

  @Prop()
  nickname: string;
  @Prop({ comment: '当前有效的 refreshToken，用于做挤下线校验' })
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
