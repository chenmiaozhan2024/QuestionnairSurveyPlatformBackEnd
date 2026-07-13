import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionnaireDocument = HydratedDocument<Questionnaire>;

// collection 指定为 'questionnaire'（单数，与数据库实际集合名一致）
// 关闭 timestamps，因为数据库实际字段是 createTime，不是 Mongoose 默认的 createdAt/updatedAt
@Schema({ collection: 'questionnaire', timestamps: false })
export class Questionnaire {
  // _id 为自定义字符串，显式声明为 String 类型
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true, comment: '问卷标题' })
  title: string;

  @Prop({ comment: '状态' })
  status: number;

  @Prop({ comment: '已收集份数' })
  totalCollected: string;

  @Prop({ type: Object, comment: '问卷说明' })
  info: any;

  @Prop({ type: Array, comment: '问题列表' })
  questions: any[];

  @Prop({ type: Array, comment: '文件列表' })
  files: any[];

  @Prop({ type: Date, comment: '创建时间' })
  createTime: Date;
}

export const QuestionnaireSchema = SchemaFactory.createForClass(Questionnaire);
