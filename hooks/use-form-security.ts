import { useMemo, useState } from 'react';

import { loginSchema, signupSchema } from '@/features/auth/schemas/auth';

export function useFormSecurity(initialState: any, fieldsToWatch: string[]) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSignup = fieldsToWatch.includes('firstName');
  const activeSchema = isSignup ? signupSchema : loginSchema;

  const validateField = (name: string, value: string, currentForm?: any) => {
    const activeForm = currentForm || form;
    const stateToValidate = { ...activeForm, [name]: value };

    const result = activeSchema.safeParse(stateToValidate);
    let errorMessage = '';

    if (!result.success) {
      const fieldError = result.error.issues.find((i) => i.path.includes(name));
      if (fieldError) errorMessage = fieldError.message;

      if (
        isSignup &&
        name === 'confirmPassword' &&
        fieldsToWatch.includes('confirmPassword') &&
        value !== activeForm.password
      ) {
        errorMessage = 'Passwords do not match.';
      }
    }

    setErrors((prev) => ({ ...prev, [name]: errorMessage }));
  };

  const updateField = (name: string, value: string) => {
    const cleanValue = name === 'email' ? value.trim().replace(/\s/g, '') : value;
    setForm((prev: any) => {
      const nextForm = { ...prev, [name]: cleanValue };
      if (errors[name] || name === 'password' || name === 'confirmPassword') {
        validateField(name, cleanValue, nextForm);
      }
      return nextForm;
    });
  };

  const setAuthError = (message: string) => {
    setErrors((prev) => ({ ...prev, auth: message }));
  };

  const isFormValid = useMemo(() => {
    const allFilled = fieldsToWatch.every(
      (key) => form[key] && form[key].trim().length > 0,
    );

    const result = activeSchema.safeParse(form);

    const schemaPass =
      result.success ||
      !result.error.issues.some((issue) =>
        fieldsToWatch.includes(issue.path[0] as string),
      );

    const match = fieldsToWatch.includes('confirmPassword')
      ? form.password === form.confirmPassword
      : true;

    return allFilled && schemaPass && match;
  }, [form, activeSchema, fieldsToWatch]);

  return { form, errors, isFormValid, updateField, validateField, setAuthError };
}
