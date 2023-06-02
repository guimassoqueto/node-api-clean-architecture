import { type AccountModel } from '@src/data/usecases/add-account/db-add-account-protocols'

export interface ChangeAccountIdRepository {
  changeId: (id: string) => Promise<AccountModel | null>
}
