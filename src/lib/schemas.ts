'use client';

import { z } from 'zod';

export const documentTypes = {
  "01": "Cédula de Identidad",
  "02": "Pasaporte",
  "03": "Licencia de Conducir"
};

export const paymentMethods = {
    "01": "Tarjeta de Crédito",
    "02": "Transferencia Bancaria",
    "03": "PayPal"
};

export const paymentPeriodicities = {
    "01": "Mensual",
    "02": "Trimestral",
    "03": "Anual"
};

export const paymentTerms = {
    "01": "12 meses",
    "02": "24 meses",
    "03": "36 meses"
};

export const sourceEvents = {
    "01": "Manual",
    "02": "Call me back",
    "03": "Call me now"
};

export const agentTypes = {
    "CC": "Contact Center (CC)",
    "APM": "Agente (APM)",
    "ADM": "Agente (ADM)"
};

// This composite schema validates the fields across all steps.
export const leadSchema = z.object({
  idFullOperation: z.string().optional(),
  
  // Step 1: Personal Details
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  documentType: z.string().min(1, 'Seleccione un tipo de documento.'),
  documentNumber: z.string().min(1, 'El número de documento es requerido.'),
  birthdate: z.string().min(1, 'La fecha de nacimiento es requerida.'),
  mobilePhone: z.string().min(1, 'El teléfono móvil es requerido.'),
  phone: z.string().optional(),
  email: z.string().email('El correo electrónico no es válido.'),
  
  // Address fields are no longer in the form, so they are not required here.
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  municipality: z.string().optional(),
  
  // Step 2: Vehicle Details
  numero_de_matricula: z.string().min(1, 'El número de matrícula es requerido.'),
  marca: z.string().min(1, 'La marca es requerida.'),
  modelo: z.string().min(1, 'El modelo es requerido.'),
  ano_del_vehiculo: z.string().min(1, 'El año del vehículo es requerido.'),
  numero_de_serie: z.string().min(1, 'El número de serie es requerido.'),

  // Step 3: Quote Details
  effectiveDate: z.string().min(1, 'La fecha de efectividad es requerida.'),
  expirationDate: z.string().min(1, 'La fecha de expiración es requerida.'),
  paymentMethod: z.string().min(1, 'Seleccione un método de pago.'),
  paymentPeriodicity: z.string().min(1, 'Seleccione una periodicidad de pago.'),
  paymentTerm: z.string().min(1, 'Seleccione un plazo de pago.'),
  
  // Step 4: Contact Preference
  sourceEvent: z.string().min(1, 'Seleccione una opción de contacto.'),
  agentType: z.string().min(1, 'Debe seleccionar un tipo de agente.'),
  UTMCampaign: z.string().optional(),

  // Step 5: Emission
  Amount: z.number().positive('El importe debe ser un número positivo.'),
  policyNumber: z.string().min(1, "El número de póliza es requerido.").max(6, "El número de póliza no puede tener más de 6 caracteres.")
});

export type LeadData = z.infer<typeof leadSchema>;
