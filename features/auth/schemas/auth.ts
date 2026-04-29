import { z } from 'zod';

import { isE164PhoneNumber, normalizePhoneNumber } from '@/lib/phone';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name is too short.')
      .regex(/^[a-zA-Z]+$/, 'First name can only contain letters.'),
    lastName: z
      .string()
      .min(2, 'Last name is too short.')
      .regex(/^[a-zA-Z]+$/, 'Last name can only contain letters.'),

    email: z.string().email('Enter a valid email address.').trim().toLowerCase(),

    phoneNumber: z
      .string()
      .min(8, 'Enter a valid phone number.')
      .max(20, 'Phone number is too long.')
      .transform((value) => normalizePhoneNumber(value))
      .refine(isE164PhoneNumber, {
        message: 'Use an international phone number like +2348012345678.',
      }),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must have at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must have at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must have at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must have at least one symbol.'),

    confirmPassword: z.string(),

    referralCode: z.string().max(24, 'Referral code is too long.').optional(),
  })

  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
