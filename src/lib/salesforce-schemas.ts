import { z } from 'zod';

// This schema defines ALL possible fields that can be part of the form state.
// This is a "flat" structure that collects all user inputs.
// The `buildLeadPayload` function in `page.tsx` will be responsible for
// transforming this flat data into the nested structure Salesforce expects.
export const FormDataSchema = z.object({
    // --- DYNAMIC FIELDS (from forms) ---
    id: z.string().optional().nullable(),
    idFullOperation: z.string().optional(),
    policyNumber: z.string().optional(),
    
    // Personal & Contact
    firstName: z.string().min(1, 'Nombre es requerido.'),
    lastName: z.string().min(1, 'Apellido es requerido.'),
    documentType: z.string().min(1, 'Tipo de documento es requerido.'),
    documentNumber: z.string().min(1, 'Número de documento es requerido.'),
    birthdate: z.string().min(1, 'Fecha de nacimiento es requerida.'),
    mobilePhone: z.string().min(1, 'Teléfono móvil es requerido.'),
    phone: z.string().optional(),
    email: z.string().email('Correo electrónico no válido.'),
    
    // Vehicle Data
    numero_de_matricula: z.string().min(1, 'Matrícula es requerida.'),
    marca: z.string().min(1, 'Marca es requerida.'),
    modelo: z.string().min(1, 'Modelo es requerido.'),
    ano_del_vehiculo: z.string().min(1, 'Año del vehículo es requerido.'),
    numero_de_serie: z.string().min(1, 'Número de serie es requerido.'),

    // Quote Data
    effectiveDate: z.string().min(1, 'Fecha de efectividad es requerida.'),
    expirationDate: z.string().min(1, 'Fecha de expiración es requerida.'),
    paymentMethod: z.string().min(1, 'Método de pago es requerido.'),
    paymentPeriodicity: z.string().min(1, 'Periodicidad de pago es requerida.'),
    paymentTerm: z.string().min(1, 'Plazo de pago es requerido.'),

    // Contact Preference Data (Step 4)
    agentType: z.string().optional(), // Frontend only field for logic
    sourceEvent: z.string().optional(),

    // Emission Data (Step 5)
    convertedStatus: z.string().optional(), 

    // --- Fields that might be set dynamically based on logic ---
    utmCampaign: z.string().optional(),
    leadSource: z.string().optional(),
    origin: z.string().optional(),
    systemOrigin: z.string().optional(),
});

export type FormData = z.infer<typeof FormDataSchema>;

// Schema for the authentication token response (remains the same)
export const SalesforceTokenResponseSchema = z.object({
    access_token: z.string(),
    instance_url: z.string(),
    id: z.string(),
    token_type: z.string(),
    issued_at: z.string(),
    signature: z.string(),
});
export type SalesforceTokenResponse = z.infer<typeof SalesforceTokenResponseSchema>;
