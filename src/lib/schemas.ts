import { z } from 'zod';

export const personalDetailsSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  gender: z.string().min(1, { message: 'Por favor seleccione un género.' }),
  town: z.string().min(1, { message: 'Por favor seleccione un pueblo.' }),
  maritalStatus: z.string().min(1, { message: 'Por favor seleccione un estado civil.' }),
  dateOfBirth: z.any().refine(val => val, { message: 'La fecha de nacimiento es requerida.'}),
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  confirmEmail: z.string().email({ message: 'Correo electrónico inválido.' }),
  phone: z.string().min(1, { message: 'El número de teléfono es requerido.' }),
  isPrincipalDriver: z.string().min(1, { message: 'Por favor seleccione una opción.' }),
  hasInsuranceAgent: z.string().optional(),
}).refine(data => data.email === data.confirmEmail, {
    message: 'Los correos electrónicos no coinciden.',
    path: ['confirmEmail'],
});

export const contactDetailsSchema = z.object({
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
  confirmEmail: z.string().email({ message: 'Correo electrónico inválido.' }),
  phone: z.string().min(1, { message: 'El número de teléfono es requerido.' }),
}).refine(data => data.email === data.confirmEmail, {
    message: 'Los correos electrónicos no coinciden.',
    path: ['confirmEmail'],
});

export const vehicleUsageSchema = z.object({
    isPrincipalDriver: z.string().min(1, { message: 'Por favor seleccione una opción.' }),
    hasInsuranceAgent: z.string().optional(),
})

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
export type VehicleUsageData = z.infer<typeof vehicleUsageSchema>;
export type DemographicInfoData = z.infer<typeof demographicInfoSchema>;
