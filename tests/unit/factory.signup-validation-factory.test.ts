import { makeSignUpValidation } from "../../src/main/factories/signup-validation"
import { ValidationComposite } from "../../src/presentation/helpers/validators/validation-composite"
import { RequiredFieldValidation } from "../../src/presentation/helpers/validators/required-field-validation"
import { Validation } from "../../src/presentation/helpers/validators/validation"

jest.mock("../../src/presentation/helpers/validators/validation-composite")

describe('SignUpValidation Factory' , () => {
  test('Should call ValidationComposite with all validations', () => {
    makeSignUpValidation()
    const validations: Validation[] = []
    for (const requiredField of ["name", "email", "password", "passwordConfirmation"]) {
      validations.push(new RequiredFieldValidation(requiredField) )
    }

    expect(ValidationComposite).toHaveBeenCalledWith(validations)
  })
})
