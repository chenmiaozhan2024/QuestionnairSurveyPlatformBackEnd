import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionnaireFillInDocument = HydratedDocument<QuestionnaireFillIn>;

// collection 指定为 'questionnaire_fill_in'（答卷集合）
@Schema({ collection: 'questionnaire_fill_in', timestamps: false })
export class QuestionnaireFillIn {
  // _id 为自定义字符串（如 "0-s-4"），显式声明为 String 类型
  @Prop({ type: String })
  _id: string;

  @Prop({ type: String, comment: '答卷标题' })
  title: string;

  @Prop({ type: Object, comment: '答卷说明' })
  info: any;

  @Prop({ type: Array, comment: '答案列表' })
  answers: any[];

  @Prop({ type: Array, comment: '题目列表' })
  questions: any[];

  @Prop({ type: Number, comment: '状态' })
  status: number;

  @Prop({ type: Date, comment: '创建时间' })
  createTime: Date;

  @Prop({ type: Number, comment: '已收集份数' })
  totalCollected: number;

  @Prop({ type: Array, comment: '文件列表' })
  files: any[];

  @Prop({ type: String, comment: '关联的问卷 ID' })
  surveyId: string;

  @Prop({ type: Date, comment: '填写时间' })
  collectTime: Date;

  @Prop({ type: Date, comment: '删除时间', default: null })
  deleteTime: Date | null;
}

export const QuestionnaireFillInSchema =
  SchemaFactory.createForClass(QuestionnaireFillIn);
