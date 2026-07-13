import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import {
  Questionnaire,
  QuestionnaireSchema,
} from './schema/questionnaire.schema';
import {
  QuestionnaireFillIn,
  QuestionnaireFillInSchema,
} from './schema/questionnaire-fill-in.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Questionnaire.name, schema: QuestionnaireSchema },
      { name: QuestionnaireFillIn.name, schema: QuestionnaireFillInSchema },
    ]),
  ],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
})
export class QuestionnaireModule {}
