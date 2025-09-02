'use client';

import { z } from 'zod';

export const documentTypes = {
  "01": "Cédula de Identidad",
  "02": "Pasaporte",
  "03": "Licencia de Conducir",
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

export const leadSchema = z.object({
  // Step 1
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  documentType: z.string().min(1, 'Seleccione un tipo de documento.'),
  documentNumber: z.string().min(1, 'El número de documento es requerido.'),
  birthdate: z.string().min(1, { message: 'La fecha de nacimiento es requerida.'}),
  mobilePhone: z.string().min(1, 'El teléfono móvil es requerido.'),
  phone: z.string().min(1, 'El teléfono es requerido.'),
  email: z.string().email('El correo electrónico no es válido.'),
  
  // Step 2
  numero_de_matricula: z.string().min(1, 'El número de matrícula es requerido.'),
  marca: z.string().min(1, 'La marca es requerida.'),
  modelo: z.string().min(1, 'El modelo es requerido.'),
  ano_del_vehiculo: z.string().min(1, 'El año del vehículo es requerido.'),
  numero_de_serie: z.string().min(1, 'El número de serie es requerido.'),

  // Step 3
  effectiveDate: z.string().min(1, { message: 'La fecha de efectividad es requerida.'}),
  expirationDate: z.string().min(1, { message: 'La fecha de expiración es requerida.'}),
  paymentMethod: z.string().min(1, 'Seleccione un método de pago.'),
  paymentPeriodicity: z.string().min(1, 'Seleccione una periodicidad de pago.'),
  paymentTerm: z.string().min(1, 'Seleccione un plazo de pago.'),
});

export type LeadData = z.infer<typeof leadSchema>;
