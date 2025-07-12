/**
 * @file shared/src/validation.ts
 * @description Validation schemas and types
 */

// Base validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Validation schemas (can be used with libraries like Joi, Yup, or Zod)
export interface CourseValidationSchema {
  name: {
    required: true;
    minLength: 1;
    maxLength: 100;
  };
  location: {
    maxLength: 200;
  };
  holes: {
    minItems: 1;
    maxItems: 18;
  };
}

export interface RoundValidationSchema {
  courseId: {
    required: true;
    format: 'uuid';
  };
  playerId: {
    required: true;
    format: 'uuid';
  };
  status: {
    required: true;
    enum: ['active', 'completed', 'abandoned'];
  };
}

export interface ScoreValidationSchema {
  strokes: {
    required: true;
    min: 1;
    max: 20;
  };
  putts: {
    min: 0;
    max: 10;
  };
  penalties: {
    min: 0;
    max: 10;
  };
}

export interface UserValidationSchema {
  email: {
    required: true;
    format: 'email';
  };
  firstName: {
    required: true;
    minLength: 1;
    maxLength: 50;
  };
  lastName: {
    required: true;
    minLength: 1;
    maxLength: 50;
  };
  handicap: {
    min: -10;
    max: 54;
  };
}

// Validation helper types
export type ValidatorFunction<T> = (value: T) => ValidationResult;

export interface FieldValidator {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  format?: 'email' | 'url' | 'uuid' | 'date';
  enum?: string[];
  custom?: ValidatorFunction<any>;
}

export interface ValidationSchema {
  [field: string]: FieldValidator;
}