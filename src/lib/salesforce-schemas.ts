import { z } from 'zod';

// This is the main schema that contains ALL possible fields from the JSON.
// Individual forms will pick the fields they need from this master schema.
const FormDataSchema = z.object({
    idFullOperation: z.string().min(1, 'ID de operación es requerido.'),
    idOwner: z.string(),
    company: z.string(),
    firstName: z.string().min(1, 'Nombre es requerido.'),
    lastName: z.string().min(1, 'Apellido es requerido.'),
    documentType: z.string().min(1, 'Tipo de documento es requerido.'),
    documentNumber: z.string().min(1, 'Número de documento es requerido.'),
    birthdate: z.string().min(1, 'Fecha de nacimiento es requerida.'),
    sex: z.string(),
    maritalStatus: z.string(),
    additionalInformation: z.string(),
    
    // Contact Data (flattened for form state)
    mobilePhone: z.string().min(1, 'Teléfono móvil es requerido.'),
    phone: z.string().min(1, 'Teléfono es requerido.'),
    email: z.string().email('Correo electrónico no válido.'),
    street: z.string(),
    postalCode: z.string(),
    city: z.string(),
    district: z.string(),
    municipality: z.string(),
    state: z.string(),
    country: z.string(),
    colony: z.string(),

    // Vehicle Data (from risk object)
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
    currencyIsoCode: z.string(),
    
    // Qualification Data
    scoring: z.number(),
    rating: z.string(),

    // GA Data
    gaClientId: z.string(),
    gaUserId: z.string(),
    gaTrackId: z.string(),
    gaTerm: z.string(),
    gaMedium: z.string(),
    
    // UTM Data
    utmCampaign: z.string(),
    utmContent: z.string(),
    utmSource: z.string(),
    
    // Source Data
    sourceEvent: z.string(),
    eventReason: z.string(),
    sourceSite: z.string(),
    screenName: z.string(),
    deviceType: z.string(),
    deviceModel: z.string(),
    leadSource: z.string(),
    origin: z.string(),
    systemOrigin: z.string(),
    
    // IP Data
    ipSubmitter: z.string(),
    ipHostName: z.string(),
    ipCity: z.string(),
    ipRegion: z.string(),
    ipCountry: z.string(),
    ipPostalCode: z.string(),
    ipLocation: z.string(),
    ipOrganization: z.string(),

    // Conversion Data
    convertedStatus: z.string().optional(), // Optional, as it's not always present
    policyNumber: z.string().nullable().optional(),
});


// Schema for the INITIAL CREATION of the Lead (Step 3)
// It doesn't include 'id' because it doesn't exist yet.
export const InsertLeadInputSchema = FormDataSchema;
export type InsertLeadInput = z.infer<typeof InsertLeadInputSchema>;


// Schema for SUBSEQUENT UPDATES of the Lead (Steps 4 and 5)
// It requires the 'id' of the lead to update.
export const UpdateLeadInputSchema = FormDataSchema.extend({
    id: z.string().min(1, "El ID del Lead es requerido para la actualización."),
    agentType: z.string().optional(), // Frontend only field
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
