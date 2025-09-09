import { z } from 'zod';

const AddressSchema = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  district: z.string(),
  municipality: z.string(),
  state: z.string(),
  country: z.string(),
  colony: z.string(),
});

const ContactDataSchema = z.object({
  mobilePhone: z.string(),
  phone: z.string(),
  email: z.string().email(),
  address: AddressSchema,
});

const QuoteSchema = z.object({
    id: z.string(),
    issueDate: z.string(),
    dueDate: z.string(),
    effectiveDate: z.string(),
    expirationDate: z.string(),
    productCode: z.string(),
    productName: z.string(),
    netPremium: z.number(),
    totalPremium: z.number(),
    paymentMethod: z.string(),
    currencyIsoCode: z.string(),
    isSelected: z.boolean(),
    discount: z.string(),
    paymentPeriodicity: z.string(),
    paymentTerm: z.string(),
    additionalInformation: z.string(),
});

const InterestProductSchema = z.object({
    businessLine: z.string(),
    sector: z.string(),
    subsector: z.string(),
    branch: z.string(),
    risk: z.string(),
    quotes: z.array(QuoteSchema),
});

const QualificationDataSchema = z.object({
  scoring: z.number(),
  rating: z.string(),
});

const GoogleAnalyticsDataSchema = z.object({
    gaClientId: z.string(),
    gaUserId: z.string(),
    gaTrackId: z.string(),
    gaTerm: z.string(),
    gaMedium: z.string(),
});

const UTMDataSchema = z.object({
    utmCampaign: z.string(),
    utmContent: z.string(),
    utmSource: z.string(),
});

const IpDataSchema = z.object({
    ipSubmitter: z.string(),
    ipHostName: z.string(),
    ipCity: z.string(),
    ipRegion: z.string(),
    ipCountry: z.string(),
    ipPostalCode: z.string(),
    ipLocation: z.string(),
    ipOrganization: z.string(),
});

const SourceDataSchema = z.object({
    sourceEvent: z.string(),
    eventReason: z.string(),
    sourceSite: z.string(),
    screenName: z.string(),
    deviceType: z.string(),
    deviceModel: z.string(),
    leadSource: z.string(),
    origin: z.string(),
    systemOrigin: z.string(),
    ipData: IpDataSchema,
});

const ConversionDataSchema = z.object({
  convertedStatus: z.string(),
  policyNumber: z.string().nullable(),
});

// Base schema for data collected from forms
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
    convertedStatus: z.string(),
    policyNumber: z.string().nullable(),
});


// Schema for the INITIAL CREATION of the Lead (Step 3)
export const InsertLeadInputSchema = FormDataSchema;
export type InsertLeadInput = z.infer<typeof InsertLeadInputSchema>;


// Schema for SUBSEQUENT UPDATES of the Lead (Steps 4 and 5)
export const UpdateLeadInputSchema = FormDataSchema.extend({
    id: z.string().min(1, "El ID del Lead es requerido para la actualización."),
    agentType: z.string().optional(), // Frontend only
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
