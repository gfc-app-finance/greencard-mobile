import { z } from 'zod';

export const bankPaymentSchema = z.object({
  recipientBankId: z.string().min(1, 'Select a recipient bank.'),
  recipientBankName: z.string().min(1, 'Recipient bank is required.'),
  recipientAccountNumber: z
    .string()
    .min(8, 'Enter a valid account number.')
    .max(20, 'Account number looks too long.'),
  recipientAccountName: z.string().min(2, 'Recipient account name is required.'),
  amount: z
    .string()
    .min(1, 'Enter an amount.')
    .refine((value) => Number.parseFloat(value) > 0, 'Amount must be greater than zero.'),
  currencyCode: z.string().min(1, 'Choose a currency.'),
  note: z.string().min(2, 'Add a short payment note.'),
  sourceAccountId: z.string().min(1, 'Choose a source account.'),
  saveRecipient: z.boolean(),
});

export const internationalPaymentSchema = z.object({
  destinationId: z.enum(['uk', 'us', 'europe', 'canada', 'other'], {
    message: 'Select a destination.',
  }),
  recipientFullName: z.string().min(2, 'Recipient full name is required.'),
  recipientBankName: z.string().min(2, 'Recipient bank name is required.'),
  routingValueOne: z.string().min(2, 'Complete the primary routing detail.'),
  routingValueTwo: z.string().min(2, 'Complete the secondary routing detail.'),
  amount: z
    .string()
    .min(1, 'Enter an amount.')
    .refine((value) => Number.parseFloat(value) > 0, 'Amount must be greater than zero.'),
  currencyCode: z.string().min(1, 'Choose a currency.'),
  note: z.string().min(2, 'Add a payment purpose or note.'),
  sourceAccountId: z.string().min(1, 'Choose a source account.'),
  saveRecipient: z.boolean(),
});
