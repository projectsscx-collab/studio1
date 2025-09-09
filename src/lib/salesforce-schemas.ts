import { z } from 'zod';

// This schema defines ALL possible fields that can be part of the form state.
// It is used for both creation and updates, with some fields being optional
// depending on the operation.
const FormDataSchema = z.object({
    // --- DYNAMIC FIELDS (from forms) ---
    id: z.string().optional().nullable(),
    idFullOperation: z.string().optional(),
    
    // Personal & Contact
    firstName: z.string().min(1, 'Nombre es requerido.'),
    lastName: z.string().min(1, 'Apellido es requerido.'),
    documentType: z.string().min(1, 'Tipo de documento es requerido.'),
    documentNumber: z.string().min(1, 'Número de documento es requerido.'),
    birthdate: z.string().min(1, 'Fecha de nacimiento es requerida.'),
    mobilePhone: z.string().min(1, 'Teléfono móvil es requerido.'),
    phone: z.string().optional(),
    email: z.string().email('Correo electrónico no válido.'),
    
    // Vehicle Data (will be stringified into 'risk')
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

    // Contact Preference Data
    agentType: z.string().optional(), // Frontend only field for logic

    // Emission Data
    convertedStatus: z.string().optional(), 
    policyNumber: z.string().optional().nullable(),

    // --- STATIC & HARDCODED FIELDS ---
    idOwner: z.string().optional().nullable(),
    company: z.string().optional(),
    additionalInformation: z.string().optional(),

    // Contact Address (Hardcoded)
    street: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    municipality: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    colony: z.string().optional(),

    // Interest Product (Hardcoded)
    businessLine: z.string().optional(),
    sector: z.string().optional(),
    subsector: z.string().optional(),
    branch: z.string().optional(),
    
    // Quotes array fields (Hardcoded)
    quoteId: z.string().optional(),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    productCode: z.string().optional(),
    productName: z.string().optional(),
    netPremiumQuote: z.number().optional(),
    totalPremium: z.number().optional(),
    currencyIsoCode: z.string().optional(),
    isSelected: z.boolean().optional(),
    discount: z.string().optional(),
    quoteAdditionalInfo: z.string().optional(),
    
    // commercialStructureData (Hardcoded)
    idIntermediary: z.string().optional().nullable(),
    regionalOffice: z.string().optional().nullable(),
    managerOffice: z.string().optional().nullable(),
    
    // qualificationData (Hardcoded)
    scoring: z.string().optional(),
    rating: z.string().optional(),

    // googleAnalyticsData (Hardcoded)
    gaClientId: z.string().optional(),
    gaUserId: z.string().optional(),
    gaTrackId: z.string().optional(),
    gaTerm: z.string().optional(),
    gaMedium: z.string().optional(),

    // utmData (Hardcoded)
    utmCampaign: z.string().optional(),
    utmContent: z.string().optional(),
    utmSource: z.string().optional(),
    
    // sourceData (Hardcoded)
    sourceEvent: z.string().optional(),
    eventReason: z.string().optional(),
    sourceSite: z.string().optional(),
    screenName: z.string().optional(),
    deviceType: z.string().optional(),
    deviceModel: z.string().optional(),
    leadSource: z.string().optional(),
    origin: z.string().optional(),
    systemOrigin: z.string().optional(),
    
    // ipData (Hardcoded)
    ipSubmitter: z.string().optional(),
    ipHostName: z.string().optional(),
    ipCity: z.string().optional(),
    ipRegion: z.string().optional(),
    ipCountry: z.string().optional(),
    ipPostalCode: z.string().optional(),
    ipLocation: z.string().optional(),
    ipOrganization: z.string().optional(),
});


// Schema for the INITIAL CREATION of the Lead (Step 3)
export const InsertLeadInputSchema = FormDataSchema;
export type InsertLeadInput = z.infer<typeof InsertLeadInputSchema>;

// Schema for UPDATING the lead (Step 4 & 5)
export const UpdateLeadInputSchema = FormDataSchema.extend({
    id: z.string().min(1, "El ID del Lead es requerido para la actualización."),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadInputSchema>;


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
