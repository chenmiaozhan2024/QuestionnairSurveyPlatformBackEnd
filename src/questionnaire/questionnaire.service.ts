import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetQuestionnaireQueryDto } from './dto/questionnaire.dto';
import {
  Questionnaire,
  QuestionnaireDocument,
} from './schema/questionnaire.schema';
import {
  QuestionnaireFillIn,
  QuestionnaireFillInDocument,
} from './schema/questionnaire-fill-in.schema';
import { BizException } from 'src/common/exceptions/biz.exception';

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectModel(Questionnaire.name)
    private questionnaireModel: Model<QuestionnaireDocument>,
    @InjectModel(QuestionnaireFillIn.name)
    private questionnaireFillInModel: Model<QuestionnaireFillInDocument>,
  ) {}
  //获取所有的答卷
  async findInList(id: string, page: number, size: number) {
    const pageNum = Number(page);
    const sizeNum = Number(size);
    const skip = (pageNum - 1) * sizeNum;

    // 通过 _id 前缀匹配该问卷下的所有答卷（如 id="0" 匹配 "0-s-4"、"0-s-5" 等）
    const filter = { _id: { $regex: `^${id}` } };
    console.log('filter', filter);

    const [list, totalData] = await Promise.all([
      this.questionnaireFillInModel
        .find(filter)
        .skip(skip)
        .limit(sizeNum)
        .lean(),
      this.questionnaireFillInModel.countDocuments(filter),
    ]);

    return {
      data: list.map((item) => ({
        id: item._id,
        title: item.title,
        info: item.info,
        answers:
          typeof item.answers === 'string'
            ? JSON.parse(item.answers)
            : item.answers,
      })),
      totalData,
      totalPage: Math.ceil(totalData / sizeNum),
    };
  }
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
      filter.status = choice;
    }
    // console.log('choice', filter.status);

    const skip = (page - 1) * size;

    const [list, totalData] = await Promise.all([
      this.questionnaireModel.find(filter).skip(skip).limit(size),
      this.questionnaireModel.countDocuments(filter),
    ]);

    return {
      totalData,
      totalPage: Math.ceil(totalData / size),
      data: list.map((item) => ({
        id: item._id,
        title: item.title,
        info: item.info,
        createTime: item.createTime,
        status: item.status,
        totalCollected: item.totalCollected,
      })),
    };
  }
  // 根据 id 获取单个答卷详情
  async finllInById(id: string) {
    const item = await this.questionnaireModel.findById(id).lean();
    // console.log('item', item);

    if (!item) {
      throw new BizException('答卷不存在');
    }
    return {
      id: item._id,
      title: item.title,
      info: item.info,
      createTime: item.createTime,
      status: item.status,
      // questions 在数据库中可能存储为 JSON 字符串或数组，统一处理为数组
      questions:
        typeof item.questions === 'string'
          ? JSON.parse(item.questions)
          : item.questions,
      // deleteTime: item.deleteTime ?? null,
      totalCollected: item.totalCollected,
    };
  }
  // 根据 id 获取单份填报答卷
  async findFillInById(id: string) {
    const item = await this.questionnaireFillInModel.findById(id).lean();
    if (!item) {
      throw new BizException('答卷不存在');
    }
    // 联查父问卷，获取 title 和 files
    let title = '';
    let info: any = '';
    let files: any[] = [];
    let surveyID = '';
    if (item.surveyId) {
      surveyID = item.surveyId;
      const parent = await this.questionnaireModel
        .findById(item.surveyId)
        .lean();
      if (parent) {
        title = parent.title;
        info = parent.info ?? '';
        files = parent.files ?? [];
      }
    }
    return {
      id: item._id,
      surveyID,
      title,
      info,
      files,
      collectTime: item.collectTime ?? null,
      answers:
        typeof item.answers === 'string'
          ? JSON.parse(item.answers)
          : item.answers,
    };
  }
}
