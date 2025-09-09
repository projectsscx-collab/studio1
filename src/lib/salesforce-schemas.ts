import { z } from 'zod';

// This is the main schema that contains ALL possible fields from the JSON.
// Individual forms will pick the fields they need from this master schema.
const FormDataSchema = z.object({
    idFullOperation: z.string().optional(),
    idOwner: z.string().optional(),
    company: z.string().optional(),
    firstName: z.string().min(1, 'Nombre es requerido.'),
    lastName: z.string().min(1, 'Apellido es requerido.'),
    documentType: z.string().min(1, 'Tipo de documento es requerido.'),
    documentNumber: z.string().min(1, 'Número de documento es requerido.'),
    birthdate: z.string().min(1, 'Fecha de nacimiento es requerida.'),
    sex: z.string().optional(),
    maritalStatus: z.string().optional(),
    additionalInformation: z.string().optional(),
    
    // Contact Data (flattened for form state)
    mobilePhone: z.string().min(1, 'Teléfono móvil es requerido.'),
    phone: z.string().min(1, 'Teléfono es requerido.'),
    email: z.string().email('Correo electrónico no válido.'),
    street: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    municipality: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    colony: z.string().optional(),

    // Vehicle Data (from risk object)
    numero_de_matricula: z.string().min(1, 'Matrícula es requerida.'),
    marca: z.string().min(1, 'Marca es requerida.'),
    modelo: z.string().min(1, 'Modelo es requerido.'),
    ano_del_vehiculo: z.string().min(1, 'Año del vehículo es requerido.'),
    numero_de_serie: z.string().min(1, 'Número de serie es requerido.'),

    // Quote and Interest Product Data
    businessLine: z.string().optional(),
    sector: z.string().optional(),
    subsector: z.string().optional(),
    branch: z.string().optional(),
    effectiveDate: z.string().min(1, 'Fecha de efectividad es requerida.'),
    expirationDate: z.string().min(1, 'Fecha de expiración es requerida.'),
    paymentMethod: z.string().min(1, 'Método de pago es requerido.'),
    paymentPeriodicity: z.string().min(1, 'Periodicidad de pago es requerida.'),
    paymentTerm: z.string().min(1, 'Plazo de pago es requerido.'),
    currencyIsoCode: z.string().optional(),
    
    // Qualification Data
    scoring: z.number().optional(),
    rating: z.string().optional(),

    // GA Data
    gaClientId: z.string().optional(),
    gaUserId: z.string().optional(),
    gaTrackId: z.string().optional(),
    gaTerm: z.string().optional(),
    gaMedium: z.string().optional(),
    
    // UTM Data
    utmCampaign: z.string().optional(),
    utmContent: z.string().optional(),
    utmSource: z.string().optional(),
    
    // Source Data
    sourceEvent: z.string().optional(),
    eventReason: z.string().optional(),
    sourceSite: z.string().optional(),
    screenName: z.string().optional(),
    deviceType: z.string().optional(),
    deviceModel: z.string().optional(),
    leadSource: z.string().optional(),
    origin: z.string().optional(),
    systemOrigin: z.string().optional(),
    
    // IP Data
    ipSubmitter: z.string().optional(),
    ipHostName: z.string().optional(),
    ipCity: z.string().optional(),
    ipRegion: z.string().optional(),
    ipCountry: z.string().optional(),
    ipPostalCode: z.string().optional(),
    ipLocation: z.string().optional(),
    ipOrganization: z.string().optional(),

    // Conversion Data
    convertedStatus: z.string().optional(), 
    policyNumber: z.string().optional(),
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
