import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetQuestionnaireQueryDto {
  // 问卷标题模糊查询，可选
  @IsString()
  @IsOptional()
  title?: string;

  // 选项类型，可选
  @IsString()
  @IsOptional()
  choice?: string;

  // 页码，最小1
  @Transform(({ value }) => parseInt(value)) // 把url字符串转数字
  @IsInt()
  @Min(1)
  page: number;

  // 每页条数
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  size: number;
}
