import { z } from 'zod';

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


export const InsertLeadInputSchema = z.object({
  // Token and instance URL from auth step
  accessToken: z.string(),
  instanceUrl: z.string(),

  // Form data from steps 1-3
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  documentType: z.string().min(1, 'Seleccione un tipo de documento.'),
  documentNumber: z.string().min(1, 'El número de documento es requerido.'),
  birthdate: z.string().min(1, { message: 'La fecha de nacimiento es requerida.'}),
  mobilePhone: z.string().min(1, 'El teléfono móvil es requerido.'),
  phone: z.string().min(1, 'El teléfono es requerido.'),
  email: z.string().email('El correo electrónico no es válido.'),
  
  numero_de_matricula: z.string().min(1, 'El número de matrícula es requerido.'),
  marca: z.string().min(1, 'La marca es requerida.'),
  modelo: z.string().min(1, 'El modelo es requerido.'),
  ano_del_vehiculo: z.string().min(1, 'El año del vehículo es requerido.'),
  numero_de_serie: z.string().min(1, 'El número de serie es requerido.'),
  
  effectiveDate: z.string().min(1, { message: 'La fecha de efectividad es requerida.'}),
  expirationDate: z.string().min(1, { message: 'La fecha de expiración es requerida.'}),
  paymentMethod: z.string().min(1, 'Seleccione un método de pago.'),
  paymentPeriodicity: z.string().min(1, 'Seleccione una periodicidad de pago.'),
  paymentTerm: z.string().min(1, 'Seleccione un plazo de pago.'),
});
export type InsertLeadInput = z.infer<typeof InsertLeadInputSchema>;

// Schema for the update flow. It's more flexible as fields are optional.
export const UpdateLeadInputSchema = z.object({
    accessToken: z.string(),
    instanceUrl: z.string(),
    idFullOperation: z.string(), // This is the key to find the lead
    // Fields from step 4
    sourceEvent: z.string().optional(),
    agentType: z.string().optional(),
    agentId: z.string().optional(),
    additionalInformation: z.string().optional(),
    // Fields from step 5
    convertedStatus: z.string().optional(),
    policyNumber: z.string().optional(),
    // We also need the quote details for the final emission step
    effectiveDate: z.string().optional(),
    expirationDate: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentPeriodicity: z.string().optional(),
    paymentTerm: z.string().optional(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadInputSchema>;
