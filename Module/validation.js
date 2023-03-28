const Joi = require("joi");

const validateDetails = (details) => {
  const nameSchema = Joi.string()
    .pattern(new RegExp("^[a-zA-Z]{3,30}$"))
    .required()
    .messages({
      "string.base": "Name must be a string",
      "string.empty": "Name cannot be empty",
      "string.pattern.base": "Name must only contain letters",
      "string.min": "Name must be at least {#limit} characters long",
      "string.max": "Name cannot be longer than {#limit} characters",
      "any.required": "Name is required",
    });

  const usernameSchema = Joi.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .required()
    .error(
      new Error(
        "Username must be between 3 and 30 characters and can only contain letters, numbers, and underscores"
      )
    );

  const emailSchema = Joi.string()
    .email()
    .required()
    .error(new Error("Email must be a valid email address"));

  const passwordSchema = Joi.string()
    .min(8)
    .max(30)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})"
      )
    )
    .required()
    .error(
      new Error(
        "Password must contain at least 8 characters, including uppercase and lowercase letters, numbers, and special characters"
      )
    );

  const contactNumberSchema = Joi.string()
    .length(10)
    .pattern(new RegExp("^[0-9]+$"))
    .required()
    .error(new Error("Contact number must be a 10 digit number"));

  const firstNameValidation = nameSchema.validate(details.firstName);
  if (firstNameValidation.error) {
    return firstNameValidation.error;
  }

  const lastNameValidation = nameSchema.validate(details.lastName);
  if (lastNameValidation.error) {
    return lastNameValidation.error;
  }

  const usernameValidation = usernameSchema.validate(details.username);
  if (usernameValidation.error) {
    return usernameValidation.error;
  }

  const emailValidation = emailSchema.validate(details.email);
  if (emailValidation.error) {
    return emailValidation.error;
  }

  const passwordValidation = passwordSchema.validate(details.password);
  if (passwordValidation.error) {
    return passwordValidation.error;
  }

  

  const contactNumberValidation = contactNumberSchema.validate(
    details.contactNumber
  );
  if (contactNumberValidation.error) {
    return contactNumberValidation.error;
  }

  return false;
};

module.exports = validateDetails;
