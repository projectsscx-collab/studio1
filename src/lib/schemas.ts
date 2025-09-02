import { z } from 'zod';

export const personalDetailsSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  dateOfBirth: z.string({
    required_error: 'A date of birth is required.',
  }),
  nationality: z.string().min(1, { message: 'Please select a nationality.' }),
  documentType: z.string().min(1, { message: 'Please select a document type.'}),
  documentNumber: z.string().min(1, { message: 'Document number is required.'}),
});

export const contactDetailsSchema = z.object({
  address: z.string().min(5, { message: 'Address is too short.' }),
  city: z.string().min(2, { message: 'City name is too short.' }),
  state: z.string().min(2, { message: 'State name is too short.' }),
  zip: z.string().min(4, { message: 'ZIP code is too short.' }),
  country: z.string().min(1, { message: 'Please select a country.' }),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
});

export const demographicInfoSchema = z.object({
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say'], {
    required_error: 'Please select a gender.',
  }),
  maritalStatus: z.string().min(1, { message: 'Please select a marital status.' }),
  employmentStatus: z.string().min(1, { message: 'Please select an employment status.' }),
  educationLevel: z.string().min(1, { message: 'Please select an education level.' }),
});

export type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;
export type ContactDetailsData = z.infer<typeof contactDetailsSchema>;
export type DemographicInfoData = z.infer<typeof demographicInfoSchema>;
