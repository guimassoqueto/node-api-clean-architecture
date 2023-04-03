import { type AccountModel } from '../../../domain/models/account'
import { type AddAccount, type AddAccountModel } from '../../../domain/usecases/add-account'
import { type Encrypter } from '../../protocols/encrypter'

export class DbAddAcccount implements AddAccount {
  private readonly encrypter: Encrypter
  constructor (encrypter: Encrypter) {
    this.encrypter = encrypter
  }

  async add (account: AddAccountModel): Promise<AccountModel> {
    await this.encrypter.encrypt(account.password)
    return await new Promise(resolve => {
      resolve({
        id: 'some_id',
        ...account
      })
    })
  }
}
