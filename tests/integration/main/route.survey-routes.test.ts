import request from 'supertest'
import app from '@src/main/config/app'
import { MongoHelper } from '@src/infra/db/mongodb/helpers/mongo-helper'
import { JWT_SECRET, MONGO_URL } from '@tests/settings'
import { Collection, ObjectId } from 'mongodb'
import { AddAccountModel } from '@src/domain/usecases/account/add-account'
import { AddSurveyModel } from '@src/domain/usecases/survey/add-survey'
import { sign } from 'jsonwebtoken'

function makeFakeSurvey(): AddSurveyModel {
  return {
    question: 'any_question',
    answers: [
      {
        image: 'http://image-name.com',
        answer: 'any-answer'
      },
      {
        image: 'http://image2-name2.com',
        answer: 'any-answer2'
      }
    ],
    createdAt: new Date()
  }
}

function makeFakeAccount(): AddAccountModel {
  return {
    name: 'any-name',
    email: 'any-email',
    password: 'any-password'
  }
}

let surveyCollection: Collection
let accountCollection: Collection
let mongo: MongoHelper
describe('Surveys Route', () => {
  beforeAll(async () => {
    mongo = MongoHelper.getInstance()
    await mongo.connect(MONGO_URL)
  })

  afterAll(async () => {
    await mongo.disconnect()
  })

  beforeEach(async () => {
    surveyCollection = await mongo.getCollection('surveys')
    accountCollection = await mongo.getCollection('accounts')
    await surveyCollection.deleteMany({})
    await accountCollection.deleteMany({})
  })

  describe('POST /surveys' , () => {
    test('Should return 403 if user did not provide a valid accessToken', async () => {
      await request(app)
        .post('/api/surveys')
        .send(makeFakeSurvey())
        .expect(403)
    })
  
    test('Should return 204 if user provide a valid accessToken', async () => {
      const accountWithRole = Object.assign(makeFakeAccount(), { role: 'ADMIN' })
      const account = await accountCollection.insertOne(accountWithRole)
      const id = account.insertedId.toString()
      const accessToken = sign(id, JWT_SECRET)
  
      await accountCollection.updateOne({_id: new ObjectId(id)}, { $set: { accessToken } })
  
      await request(app)
        .post('/api/surveys')
        .set('x-access-token', accessToken)
        .send(makeFakeSurvey())
        .expect(204)
    })
  })

  describe('GET /surveys' , () => {
    test('Should return 403 if no access token is provided', async () => {
      await request(app)
        .get('/api/surveys')
        .expect(403)
    })

    test('Should return 200 or 204 on load surveys if user provide a valid accessToken', async () => {
      const account = await accountCollection.insertOne(makeFakeAccount())
      const id = account.insertedId.toString()
      const accessToken = sign(id, JWT_SECRET)
  
      await accountCollection.updateOne({_id: new ObjectId(id)}, { $set: { accessToken } })
      
      const randomBoolean = Math.random() < 0.5;
      if (randomBoolean) await surveyCollection.insertOne(makeFakeSurvey())
      const statusCode = randomBoolean ? 200 : 204

      await request(app)
        .get('/api/surveys')
        .set('x-access-token', accessToken)
        .send(makeFakeSurvey())
        .expect(statusCode)
    })
  })
  
})
