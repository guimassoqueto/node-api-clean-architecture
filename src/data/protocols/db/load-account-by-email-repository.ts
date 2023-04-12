import { type AccountModel } from '../../usecases/authentication/db-authentication-protocols'

export interface LoadAccountByEmailRepository {
  load: (email: string) => Promise<AccountModel | null >
}
