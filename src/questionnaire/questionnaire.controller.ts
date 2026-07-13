import { Body, Controller, Get, Query, Put, Param } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { GetQuestionnaireQueryDto } from './dto/questionnaire.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('/questionnaire')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}
  // 分页获取问卷列表
  // @Public()
  @Get()
  async findAll(@Query() query: GetQuestionnaireQueryDto) {
    // query 内包含 title / choice / page / size
    // console.log(query);
    const result = await this.questionnaireService.findList(query);
    // console.log('result', result);

    return result;
  }
  // 根据id修改状态
  @Put('/status')
  @Public()
  changeStatus(@Query('id') id: string, @Query('newStatus') newStatus: number) {
    return this.questionnaireService.changeStatusById(id, newStatus);
    // console.log('id', id, 'newStatus', newStatus);
  }
  @Get('/getFillIn')
  @Public()
  // 根据id获取所有答卷
  async getFillIn(
    @Query('id') id: string,
    @Query('page') page: number,
    @Query('size') size: number,
  ) {
    const result = await this.questionnaireService.findInList(id, page, size);
    // console.log('result', result);

    return result;
  }
  //根据id获取问卷详情
  @Get(':id')
  @Public()
  async getFinllInById(@Param('id') id: string) {
    console.log('id');

    const result = await this.questionnaireService.finllInById(id);
    return result;
    // console.log('id', id);
  }
  // 根据id获取单份答卷
  @Get('/getFillIn/:id')
  async getAnswerById(@Param('id') id: string) {
    console.log('id', id);

    return this.questionnaireService.findFillInById(id);
  }
}
