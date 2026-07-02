import { Module } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';

@Module({
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
})
export class QuestionnaireModule {}
