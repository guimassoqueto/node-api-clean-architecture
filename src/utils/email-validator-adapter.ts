import { type EmailValidator } from '../presentation/protocols'
import validator from 'validator'

export class EmailValidatorAdapter implements EmailValidator {
  isValid (email: string): boolean {
    const isEmailValid = validator.isEmail(email)
    return isEmailValid
  }
}
