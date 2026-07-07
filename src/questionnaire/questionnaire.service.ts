import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetQuestionnaireQueryDto } from './dto/questionnaire.dto';
import {
  Questionnaire,
  QuestionnaireDocument,
} from './schema/questionnaire.schema';
import { BizException } from 'src/common/exceptions/biz.exception';

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectModel(Questionnaire.name)
    private questionnaireModel: Model<QuestionnaireDocument>,
  ) {}
  async changeStatusById(id: string, newStatus: number) {
    // 1. 更新数据库
    const result = await this.questionnaireModel.findByIdAndUpdate(
      id,
      { $set: { status: newStatus } },
      { new: true }, // 返回更新后的文档
    );

    // 2. 文档不存在
    if (!result) {
      throw new BizException('问卷不存在');
    }

    // 3. 返回更新后的数据
    return {};
  }
  // 分页查询问卷列表
  async findList(query: GetQuestionnaireQueryDto) {
    const { title, choice, page, size } = query;
    console.log(query);

    // // 组装筛选条件：模糊匹配 title，精确匹配 choice
    const filter: Record<string, any> = {};
    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (choice) {
      filter.choice = choice;
    }

    const skip = (page - 1) * size;

    const list = await this.questionnaireModel
      .find(filter)
      .skip(skip)
      .limit(size);

    // const total = await this.questionnaireModel.countDocuments(filter);
    return list.map((item) => ({
      id: item._id,
      title: item.title,
      info: item.info,
      createTime: item.createTime,
      status: item.status,
      totalCollected: item.totalCollected,
    }));
  }
}
