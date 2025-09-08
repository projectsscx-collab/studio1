import { z } from 'zod';

// This schema represents the full data structure expected by the Salesforce Apex class.
// It includes all possible fields from all steps of the form.
// Optional fields are used because not all data is available at every step.
export const LeadWrapperSchema = z.object({
  // IDs - will be populated after the first API call
  id: z.string().optional().nullable(),
  idFullOperation: z.string().optional().nullable(),

  // Step 1: Personal Details
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  documentType: z.string().min(1, 'Seleccione un tipo de documento.'),
  documentNumber: z.string().min(1, 'El número de documento es requerido.'),
  birthdate: z.string().min(1, { message: 'La fecha de nacimiento es requerida.'}),
  mobilePhone: z.string().min(1, 'El teléfono móvil es requerido.'),
  phone: z.string().min(1, 'El teléfono es requerido.'),
  email: z.string().email('El correo electrónico no es válido.'),
  
  // Step 2: Vehicle Details
  numero_de_matricula: z.string().min(1, 'El número de matrícula es requerido.'),
  marca: z.string().min(1, 'La marca es requerida.'),
  modelo: z.string().min(1, 'El modelo es requerido.'),
  ano_del_vehiculo: z.string().min(1, 'El año del vehículo es requerido.'),
  numero_de_serie: z.string().min(1, 'El número de serie es requerido.'),
  
  // Step 3: Quote Details
  effectiveDate: z.string().min(1, { message: 'La fecha de efectividad es requerida.'}),
  expirationDate: z.string().min(1, { message: 'La fecha de expiración es requerida.'}),
  paymentMethod: z.string().min(1, 'Seleccione un método de pago.'),
  paymentPeriodicity: z.string().min(1, 'Seleccione una periodicidad de pago.'),
  paymentTerm: z.string().min(1, 'Seleccione un plazo de pago.'),

  // Step 4: Contact Preference
  sourceEvent: z.string().optional(),
  agentType: z.string().optional(), // Used in frontend only to determine other values
  systemOrigin: z.string().optional(),
  origin: z.string().optional(),
  utmCampaign: z.string().optional(),
  leadSource: z.string().optional(),
  
  // Step 5: Emission
  idOwner: z.string().optional(),
  convertedStatus: z.string().optional(),
  policyNumber: z.string().optional(),
});

export type LeadWrapperData = z.infer<typeof LeadWrapperSchema>;


// Schema for the authentication token response
export const SalesforceTokenResponseSchema = z.object({
    access_token: z.string(),
    instance_url: z.string(),
    id: z.string(),
    token_type: z.string(),
    issued_at: z.string(),
    signature: z.string(),
});
export type SalesforceTokenResponse = z.infer<typeof SalesforceTokenResponseSchema>;
