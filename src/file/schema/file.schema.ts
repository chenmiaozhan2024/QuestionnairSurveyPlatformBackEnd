import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FileDocument = HydratedDocument<File>;

@Schema({ collection: 'file', timestamps: false, versionKey: false })
export class File {
  @Prop({ required: true, comment: '原始文件名' })
  fileTureName: string;

  @Prop({ required: true, comment: 'UUID 文件名' })
  fileUUIDname: string;

  @Prop({ required: true, comment: '上传日期' })
  date: string;
}

export const FileSchema = SchemaFactory.createForClass(File);
