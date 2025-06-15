
import { useState, useCallback } from 'react';
import { DataValidator } from '@/services/data-validator';

interface FormField {
  value: any;
  error?: string;
  touched: boolean;
}

interface FormState {
  [key: string]: FormField;
}

interface FormConfig {
  initialValues: Record<string, any>;
  validationSchema?: any;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
}

export function useFormState(config: FormConfig) {
  const [formState, setFormState] = useState<FormState>(() => {
    const initialState: FormState = {};
    Object.entries(config.initialValues).forEach(([key, value]) => {
      initialState[key] = {
        value,
        touched: false
      };
    });
    return initialState;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        touched: true
      }
    }));
  }, []);

  const setError = useCallback((field: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error
      }
    }));
  }, []);

  const clearError = useCallback((field: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error: undefined
      }
    }));
  }, []);

  const validateField = useCallback((field: string) => {
    const fieldValue = formState[field]?.value;
    
    if (config.validationSchema) {
      try {
        const result = config.validationSchema.shape[field]?.safeParse(fieldValue);
        if (result && !result.success) {
          setError(field, result.error.issues[0]?.message || 'Invalid value');
          return false;
        } else {
          clearError(field);
          return true;
        }
      } catch (error) {
        return true; // If validation fails, assume valid
      }
    }
    
    return true;
  }, [formState, config.validationSchema, setError, clearError]);

  const validateForm = useCallback(() => {
    let isValid = true;
    Object.keys(formState).forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  }, [formState, validateField]);

  const getValues = useCallback(() => {
    const values: Record<string, any> = {};
    Object.entries(formState).forEach(([key, field]) => {
      values[key] = field.value;
    });
    return values;
  }, [formState]);

  const hasErrors = useCallback(() => {
    return Object.values(formState).some(field => field.error);
  }, [formState]);

  const reset = useCallback(() => {
    const resetState: FormState = {};
    Object.entries(config.initialValues).forEach(([key, value]) => {
      resetState[key] = {
        value,
        touched: false
      };
    });
    setFormState(resetState);
  }, [config.initialValues]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm() || hasErrors()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await config.onSubmit(getValues());
      reset();
    } catch (error) {
      // Error is handled by the onSubmit function
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, hasErrors, config.onSubmit, getValues, reset]);

  return {
    formState,
    setValue,
    setError,
    clearError,
    validateField,
    validateForm,
    getValues,
    hasErrors,
    reset,
    handleSubmit,
    isSubmitting,
    getFieldProps: (field: string) => ({
      value: formState[field]?.value || '',
      onChange: (value: any) => setValue(field, value),
      onBlur: () => validateField(field),
      error: formState[field]?.error,
      touched: formState[field]?.touched
    })
  };
}
