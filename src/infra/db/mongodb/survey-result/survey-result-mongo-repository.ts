import { type SaveSurveyResultRepository } from '@src/data/protocols/db/survey'
import { type SurveyResultModel } from '@src/domain/models/survey-result'
import { type SaveSurveyResultParams } from '@src/domain/usecases/survey-result/save-survey-result'
import { MongoHelper } from '@src/infra/db/mongodb/helpers/mongo-helper'
import { ObjectId } from 'mongodb'

export class SurveyResultMongoRepository implements SaveSurveyResultRepository {
  async save (data: SaveSurveyResultParams): Promise<SurveyResultModel> {
    const mongo = MongoHelper.getInstance()
    const surveyResultsCollection = await mongo.getCollection('surveyResults')
    await surveyResultsCollection.findOneAndUpdate(
      { surveyId: new ObjectId(data.surveyId), accountId: new ObjectId(data.accountId) },
      { $set: { answer: data.answer, date: data.date } },
      { upsert: true, returnDocument: 'after' }
    )
    const surveyResult = await this.loadBySurveyId(data.surveyId)
    return Object.assign({}, surveyResult, { surveyId: surveyResult.surveyId.toString() })
  }

  private async loadBySurveyId (surveyId: string): Promise<SurveyResultModel> {
    const mongo = MongoHelper.getInstance()
    const surveyResultsCollection = await mongo.getCollection('surveyResults')

    const query = surveyResultsCollection.aggregate([
      {
        $match: {
          surveyId: new ObjectId(surveyId)
        }
      },
      {
        $group: {
          _id: 0,
          data: {
            $push: '$$ROOT'
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $unwind: {
          path: '$data'
        }
      },
      {
        $lookup: {
          from: 'surveys',
          foreignField: '_id',
          localField: 'data.surveyId',
          as: 'survey'
        }
      },
      {
        $unwind: {
          path: '$survey'
        }
      },
      {
        $group: {
          _id: {
            surveyId: '$survey._id',
            question: '$survey.question',
            date: '$survey.date',
            total: '$count',
            answer: {
              $filter: {
                input: '$survey.answers',
                as: 'item',
                cond: {
                  $eq: ['$$item.answer', '$data.answer']
                }
              }
            }
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $unwind: {
          path: '$_id.answer'
        }
      },
      {
        $addFields: {
          '_id.answer.count': '$count',
          '_id.answer.percent': {
            $multiply: [{ $divide: ['$count', '$_id.total'] }, 100]
          }
        }
      },
      {
        $group: {
          _id: {
            surveyId: '$_id.surveyId',
            question: '$_id.question',
            date: '$_id.date'
          },
          answers: {
            $push: '$_id.answer'
          }
        }
      },
      {
        $project: {
          _id: 0,
          surveyId: '$_id.surveyId',
          question: '$_id.question',
          date: '$_id.date',
          answers: '$answers'
        }
      }
    ])
    const surveyResult = await query.toArray()
    return surveyResult[0] as SurveyResultModel
  }
}
