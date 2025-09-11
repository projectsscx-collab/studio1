
import { z } from 'zod';

// This schema defines ALL possible fields that can be part of the form state.
export const FormDataSchema = z.object({
    // --- Salesforce IDs ---
    id: z.string().optional().nullable(), // Will hold the Lead ID
    idFullOperation: z.string().optional(),
    
    // --- Personal Info ---
    firstName: z.string().min(1, 'Nombre es requerido.'),
    lastName: z.string().min(1, 'Apellido es requerido.'),
    documentType: z.string().min(1, 'Tipo de documento es requerido.'),
    documentNumber: z.string().min(1, 'Número de documento es requerido.'),
    birthdate: z.string().min(1, 'Fecha de nacimiento es requerida.'),
    
    // --- Contact Info ---
    mobilePhone: z.string().min(1, 'Teléfono móvil es requerido.'),
    phone: z.string().optional(),
    email: z.string().email('Correo electrónico no válido.'),
    
    // --- Address Info (Hardcoded as N/A or default) ---
    street: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    municipality: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    
    // --- Vehicle Data ---
    numero_de_matricula: z.string().min(1, 'Matrícula es requerida.'),
    marca: z.string().min(1, 'Marca es requerida.'),
    modelo: z.string().min(1, 'Modelo es requerido.'),
    ano_del_vehiculo: z.string().min(1, 'Año del vehículo es requerido.'),
    numero_de_serie: z.string().min(1, 'Número de serie es requerido.'),

    // --- Quote Data ---
    effectiveDate: z.string().min(1, 'Fecha de efectividad es requerida.'),
    expirationDate: z.string().min(1, 'Fecha de expiración es requerida.'),
    paymentMethod: z.string().min(1, 'Método de pago es requerido.'),
    paymentPeriodicity: z.string().min(1, 'Periodicidad de pago es requerida.'),
    paymentTerm: z.string().min(1, 'Plazo de pago es requerido.'),
    isSelected: z.boolean(), // Always required

    // --- Contact Preference Data (Step 4) ---
    agentType: z.string().optional(), // Frontend only field for logic
    sourceEvent: z.string().optional(),
    UTMCampaign: z.string().optional(),

    // --- Emission / Final Update Data (Step 5) ---
    policyNumber: z.string().optional(),
    StageName: z.string().optional().nullable(), // Corresponds to Lead 'Status'
    CloseDate: z.string().optional().nullable(),
    Amount: z.number().optional(),
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

// Defines the shape of the IDs we get from Salesforce
export interface SalesforceIds {
    id: string;
    idFullOperation: string;
}

    