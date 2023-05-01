import jwt from "jsonwebtoken";
import { Encrypter } from "../../src/data/protocols/cryptography";
import { JwtAdapter } from "../../src/infra/cryptography/jwt-adapter/jwt-adapter"
import { JWT_SECRET } from "../settings";

const mockAccessToken = "any_token"
jest.mock('jsonwebtoken', () => ({
  sign(): string {
    return mockAccessToken
  }
}))

interface SutTypes {
  sut: Encrypter
}

function makeSut(): SutTypes {
  const sut = new JwtAdapter(JWT_SECRET)

  return {
    sut
  }
}

describe('JwtAdapter' , () => {
  test('Should call sign with correct values', async () => {
    const { sut } = makeSut()
    const signSpy = jest.spyOn(jwt, "sign")
    const id = "any_id"
    
    await sut.encrypt(id)

    expect(signSpy).toHaveBeenCalledWith(id, JWT_SECRET)
  })

  test('Should returns a token on sign success', async () => {
    const { sut } = makeSut()
    const accessToken = await sut.encrypt("any_id")

    expect(accessToken).toBe(mockAccessToken)
  })

  test('Should throw if jwt throws', async () => {
    const { sut } = makeSut()
    jest.spyOn(jwt, "sign").mockImplementationOnce((payload: string | object | Buffer, secretOrPrivateKey: jwt.Secret) => {
      throw new Error()
    })

    const promise = sut.encrypt("any_id")

    await expect(promise).rejects.toThrow()
  })
})
