import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export const isIanaTimeZone = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

export const IsIanaTimeZone = (validationOptions?: ValidationOptions) =>
  (target: object, propertyName: string): void => {
    registerDecorator({
      name: 'isIanaTimeZone',
      target: target.constructor,
      propertyName,
      options: {
        message: '$property deve ser um timezone IANA válido, como America/Manaus.',
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown): boolean => isIanaTimeZone(value),
        defaultMessage: (arguments_: ValidationArguments): string =>
          `${arguments_.property} deve ser um timezone IANA válido.`,
      },
    });
  };
