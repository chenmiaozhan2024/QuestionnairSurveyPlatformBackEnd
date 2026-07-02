import { Body, Controller, Get, Query } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { GetQuestionnaireQueryDto } from './dto/questionnaire.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller()
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}
  // 分页获取问卷列表
  // @Public()
  @Get('/questionnaire')
  findAll(@Query() query: GetQuestionnaireQueryDto) {
    // query 内包含 title / choice / page / size
    // console.log(query);

    return this.questionnaireService.findList(query);
  }
}
