import { type HttpRequest, type HttpResponse, type Controller } from '@src/presentation/protocols'
import { forbidden, ok, serverError } from '@src/presentation/helpers/http'
import {
  type LoadSurveyById, loggerConfig, InvalidParamError,
  type SaveSurveyResult
} from './save-survey-result-protocols'

const logger = loggerConfig('SaveSurveyResultController')

export class SaveSurveyResultController implements Controller {
  constructor (
    private readonly loadSurveyById: LoadSurveyById,
    private readonly saveSurveyResult: SaveSurveyResult
  ) {}

  async handle (httpRequest: HttpRequest): Promise<HttpResponse> {
    try {
      const { surveyId } = httpRequest.params
      const { answer } = httpRequest.body
      const accountId = httpRequest.accountId as string

      const survey = await this.loadSurveyById.loadById(surveyId)
      if (!survey) {
        return forbidden(new InvalidParamError('surveyId'))
      }

      const answers = survey.answers.map(a => a.answer)
      if (!answers.includes(answer)) {
        return forbidden(new InvalidParamError('answer'))
      }

      await this.saveSurveyResult.save({
        accountId,
        surveyId,
        answer,
        date: new Date()
      })

      return ok('')
    } catch (error) {
      logger.info(error)
      return serverError(error)
    }
  }
}
