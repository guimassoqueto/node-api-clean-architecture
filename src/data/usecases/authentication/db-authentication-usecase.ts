import {
  type LoadAccountByEmailRepository,
  type Encrypter,
  type Authentication,
  type AuthenticationModel,
  type HashComparer,
  type UpdateAccessTokenRepository
} from './db-authentication-protocols'

export class DbAuthentication implements Authentication {
  constructor (
    private readonly loadAccountByEmailRepository: LoadAccountByEmailRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
    private readonly uptadeAccessTokenRepository: UpdateAccessTokenRepository
  ) {}

  async auth (authentication: AuthenticationModel): Promise<string | null> {
    const account = await this.loadAccountByEmailRepository.loadByEmail(authentication.email)
    if (!account) return null

    const isMatch = await this.hashComparer.compare(authentication.password, account.password)
    if (!isMatch) return null

    const token = await this.encrypter.encrypt(account.id)

    await this.uptadeAccessTokenRepository.updateAccessToken(account.id, token)

    return token
  }
}
