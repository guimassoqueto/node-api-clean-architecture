import { SaveSurveyResultController } from '@src/presentation/controllers/survey-result/save-survey-result/save-survey-result-controller'
import { HttpRequest } from '@src/presentation/protocols'
import { forbidden, serverError, ok } from '@src/presentation/helpers/http'
import { 
  LoadSurveyById, SurveyModel, InvalidParamError,
  SaveSurveyResult, SaveSurveyResultParams, SurveyResultModel
} from '@src/presentation/controllers/survey-result/save-survey-result/save-survey-result-protocols'
import { RealDate, MockDate, mockSurveyModel } from '@tests/helpers'


function mockSaveSurveyResult(): SaveSurveyResult {
  class SaveSurveyResultStub implements SaveSurveyResult {
    async save (data: SaveSurveyResultParams): Promise<SurveyResultModel> {
      return new Promise(resolve => resolve(mockSurveyResult()))
    }
  }
  return new SaveSurveyResultStub()
}

function mockLoadSurveyById(): LoadSurveyById {
  class LoadSurveyByIdStub implements LoadSurveyById {
    async loadById (id: string) : Promise<SurveyModel | null> {
      return new Promise (resolve => resolve(mockSurveyModel()))
    }
  }
  return new LoadSurveyByIdStub()
}

type SutTypes = {
  sut: SaveSurveyResultController
  loadSurveyByIdStub: LoadSurveyById
  saveSurveyResultStub: SaveSurveyResult
}

function makeSut(): SutTypes {
  const loadSurveyByIdStub = mockLoadSurveyById()
  const saveSurveyResultStub = mockSaveSurveyResult()
  const sut = new SaveSurveyResultController(loadSurveyByIdStub, saveSurveyResultStub)

  return {
    sut,
    loadSurveyByIdStub,
    saveSurveyResultStub
  }
}

function makeRequest(): HttpRequest {
  const answers = mockSurveyModel().answers
  const answer = answers[Math.floor(Math.random() * answers.length)].answer;
  return {
    params: {
      surveyId: 'any-id'
    },
    body: {
      answer
    },
    accountId: 'any-account-id'
  }
}

function mockSurveyResult(): SurveyResultModel {
  return {
    id: 'valid-id',
    surveyId: 'valid-survey-id',
    accountId: 'valid-survey-id',
    answer: 'valid-answer',
    date: new Date(2030, 11, 31)
  }
}

describe('SaveSurveyResultController' , () => {

  beforeAll(() => {
    (global as any).Date = MockDate;
  })

  afterAll(() => {
    (global as any).Date = RealDate;
  })

  test('Should call LoadSurveyById with correct args', async () => {
    const { sut, loadSurveyByIdStub } = makeSut()
    const loadByIdSpy = jest.spyOn(loadSurveyByIdStub, 'loadById')
    const request = makeRequest()

    await sut.handle(request)
    expect(loadByIdSpy).toHaveBeenCalledWith(request.params.surveyId)
  })

  test('Should return 401 if surveyId does not exist', async () => {
    const { sut, loadSurveyByIdStub } = makeSut()
    jest.spyOn(loadSurveyByIdStub, 'loadById').mockResolvedValueOnce(null)
    const request = makeRequest()

    const response = await sut.handle(request)
    expect(response).toStrictEqual(forbidden(new InvalidParamError('surveyId')))
  })

  test('Should return 500 if surveyId throws', async () => {
    const { sut, loadSurveyByIdStub } = makeSut()
    const error = new Error()
    jest.spyOn(loadSurveyByIdStub, 'loadById').mockRejectedValueOnce(error)
    const request = makeRequest()

    const response = await sut.handle(request)
    expect(response).toStrictEqual(serverError(error))
  })

  test('Should return 403 if an invalid answer is provided', async () => {
    const { sut } = makeSut()
    const request = makeRequest()
    request.body = {
      answer: 'wrong-answer'
    }

    const response = await sut.handle(request)
    expect(response).toStrictEqual(forbidden(new InvalidParamError('answer')))
  })

  test('Should call SaveSurveyResult with correct args', async () => {
    const { sut, saveSurveyResultStub } = makeSut()
    const saveSpy = jest.spyOn(saveSurveyResultStub, 'save')
    const request = makeRequest()
    await sut.handle(request)

    expect(saveSpy).toBeCalledWith({
      accountId: request.accountId,
      surveyId: request.params.surveyId,
      answer: request.body.answer,
      date: new Date()
    })
  })

  test('Should return 500 if SaveSurveyResult throws', async () => {
    const { sut, saveSurveyResultStub } = makeSut()
    const error = new Error()
    jest.spyOn(saveSurveyResultStub, 'save').mockRejectedValueOnce(error)
    const request = makeRequest()

    const response = await sut.handle(request)
    expect(response).toStrictEqual(serverError(error))
  })

  test('Should return 200 on success', async () => {
    const { sut} = makeSut()
    const request = makeRequest()

    const response = await sut.handle(request)
    expect(response).toStrictEqual(ok(mockSurveyResult()))
  })
})
