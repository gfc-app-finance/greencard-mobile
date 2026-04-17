import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name.'),
    email: z.string().email('Enter a valid email address.'),
    phoneNumber: z
      .string()
      .min(7, 'Enter a valid phone number.')
      .max(20, 'Phone number is too long.')
      .regex(/^[0-9+\-\s()]+$/, 'Enter a valid phone number.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters.'),
    referralCode: z.string().max(24, 'Referral code is too long.').optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
