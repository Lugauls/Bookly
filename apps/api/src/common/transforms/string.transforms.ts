import type { TransformFnParams } from 'class-transformer';

export const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const trimLowercaseString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export const digitsOnly = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.replace(/\D/g, '') : value;
