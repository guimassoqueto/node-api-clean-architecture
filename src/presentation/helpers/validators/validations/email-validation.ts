import { InvalidParamError } from '../../../errors'
import { type Validation } from '../../../protocols/validation'
import { type EmailValidator } from '../../../protocols'

/**
 * Verifica se o email passado na requisição é válido
 */
export class EmailValidation implements Validation {
  constructor (private readonly fieldName: string, private readonly emailValidator: EmailValidator) {}
  validate (input: any): Error | null {
    const isEmailValid = this.emailValidator.isValid(input[this.fieldName])
    if (!isEmailValid) return new InvalidParamError(this.fieldName)
    return null
  }
}
