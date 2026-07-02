import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetQuestionnaireQueryDto } from './dto/questionnaire.dto';
import {
  Questionnaire,
  QuestionnaireDocument,
} from './schema/questionnaire.schema';

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectModel(Questionnaire.name)
    private questionnaireModel: Model<QuestionnaireDocument>,
  ) {}

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
