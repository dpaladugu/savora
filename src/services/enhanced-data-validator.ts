import { z } from 'zod';
import { jsonPreloadMVPDataSchema } from './jsonPreloadValidators';
import type { JsonPreloadMVPData } from '@/types/jsonPreload';

export interface ValidationResult {
  isValid: boolean;
  data?: JsonPreloadMVPData;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

export function validateFinancialData(data: unknown): ValidationResult {
  try {
    const validatedData = jsonPreloadMVPDataSchema.parse(data);
    console.log("JSON data is valid (MVP sections):", validatedData);
    return { 
      isValid: true, 
      data: validatedData 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("JSON validation errors (MVP sections):", error.errors);
      const formattedErrors = error.errors.map(err => ({
        path: err.path.map(p => String(p)),
        message: err.message
      }));
      return { 
        isValid: false, 
        errors: formattedErrors 
      };
    }
    console.error("Unexpected validation error:", error);
    return { 
      isValid: false, 
      errors: [{ 
        path: [], 
        message: "Unexpected validation error" 
      }] 
    };
  }
}