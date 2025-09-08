'use server';

/**
 * @fileoverview Genkit flows to insert and update a lead in Salesforce.
 *
 * - insertLead - Creates a new lead in Salesforce.
 * - updateLead - Updates an existing lead in Salesforce.
 * - getSalesforceToken - Handles authentication.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for the authentication token response
const SalesforceTokenResponseSchema = z.object({
  access_token: z.string(),
  instance_url: z.string(),
  id: z.string(),
  token_type: z.string(),
  issued_at: z.string(),
  signature: z.string(),
});
export type SalesforceTokenResponse = z.infer<typeof SalesforceTokenResponseSchema>;


const InsertLeadInputSchema = z.object({
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


const UpdateLeadInputSchema = z.object({
    accessToken: z.string(),
    instanceUrl: z.string(),
    leadResultId: z.string(), // Use leadResultId for updates
    sourceEvent: z.string().optional(),
    systemOrigin: z.string().optional(),
    origin: z.string().optional(),
    utmCampaign: z.string().optional(),
    leadSource: z.string().optional(),
    convertedStatus: z.string().optional(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadInputSchema>;


// Flow to get the authentication token
export const getSalesforceTokenFlow = ai.defineFlow(
  {
    name: 'getSalesforceTokenFlow',
    inputSchema: z.void(),
    outputSchema: SalesforceTokenResponseSchema,
  },
  async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append(
      'client_id',
      '3MVG9GnaLrwG9TQSi1HwolwMYR_mPFa_N1Vlp6IDnM5CBR7gEw3J3.kA_Yq55RKLo0cpoWqEJPOG0ar8XEV32'
    );
    params.append(
      'client_secret',
      '2ED807FA499232A40E0F2A8E1A68503F39CC565D2AE677EBA4E80EDBB41F6A42'
    );
    params.append('username', 'rwsap@latam.mapfre.com.ropov3');
    params.append('password', 'R0PoCor3V3@2025!');

    const response = await fetch(
      'https://test.salesforce.com/services/oauth2/token',
      {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Salesforce login failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data;
  }
);


// Flow to insert the lead
export const insertLeadFlow = ai.defineFlow(
  {
    name: 'insertLeadFlow',
    inputSchema: InsertLeadInputSchema,
    outputSchema: z.any(),
  },
  async (input) => {
    const { accessToken, instanceUrl, ...formData } = input;
    
    const riskObject = {
        'Número de matrícula__c': formData.numero_de_matricula,
        'Marca__c': formData.marca,
        'Modelo__c': formData.modelo,
        'Año del vehículo__c': formData.ano_del_vehiculo,
        'Número de serie__c': formData.numero_de_serie,
    };

    const leadPayload = {
      leadWrappers: [{
        firstName: formData.firstName,
        lastName: formData.lastName,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        birthdate: formData.birthdate,
        contactData: {
            mobilePhone: formData.mobilePhone,
            phone: formData.phone,
            email: formData.email,
        },
        interestProduct: {
            businessLine: '01',
            sector: 'XX_01',
            subsector: 'XX_00',
            branch: 'XX_205',
            risk: JSON.stringify(riskObject),
            quotes: [
                {
                    id: 'TestWSConvertMIN',
                    effectiveDate: formData.effectiveDate,
                    expirationDate: formData.expirationDate,
                    productCode: 'PRD001',
                    productName: 'Life Insurance',
                    netPremium: 1000.0,
                    paymentMethod: formData.paymentMethod,
                    paymentPeriodicity: formData.paymentPeriodicity,
                    paymentTerm: formData.paymentTerm,
                    additionalInformation: 'test',
                    isSelected: true,
                },
            ],
        },
        sourceData: {
            sourceEvent: '01',
            eventReason: '01',
            sourceSite: 'Website',
            deviceType: '01',
            deviceModel: 'iPhone',
            leadSource: '01',
            origin: '01',
            systemOrigin: '05', 
            ipData: {},
        },
        utmData: {
            utmCampaign: 'ROPO_Auto',
        },
      }],
    };

    const leadResponse = await fetch(`${instanceUrl}/services/apexrest/core/lead/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadPayload)
    });

    if (!leadResponse.ok) {
        const errorText = await leadResponse.text();
        console.error("Salesforce Error Response:", errorText);
        throw new Error(`Failed to insert lead: ${leadResponse.status} ${errorText}`);
    }

    return await leadResponse.json();
  }
);


// Flow to update the lead
export const updateLeadFlow = ai.defineFlow(
  {
    name: 'updateLeadFlow',
    inputSchema: UpdateLeadInputSchema,
    outputSchema: z.any(),
  },
  async (input) => {
    const { accessToken, instanceUrl, ...updateData } = input;
    
    // Construct a payload with only the fields to be updated
    const updatePayload = {
      leadWrappers: [
        {
          // We use the leadResultId from the creation step as the idFullOperation for updates
          idFullOperation: updateData.leadResultId, 
          sourceData: {
              sourceEvent: updateData.sourceEvent,
              systemOrigin: updateData.systemOrigin,
              origin: updateData.origin,
              leadSource: updateData.leadSource,
          },
          utmData: {
              utmCampaign: updateData.utmCampaign,
          },
          conversionData: {
              convertedStatus: updateData.convertedStatus,
          }
        }
      ]
    };
    
    const leadResponse = await fetch(`${instanceUrl}/services/apexrest/core/lead/`, {
        method: 'POST', // Use POST for updates as specified by the API
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
    });

    if (!leadResponse.ok) {
        const errorText = await leadResponse.text();
        console.error("Salesforce Update Error Response:", errorText);
        throw new Error(`Failed to update lead: ${leadResponse.status} ${errorText}`);
    }
    
    // Update might return 204 No Content, so handle that case
    if (leadResponse.status === 204) {
        return { success: true, message: "Lead updated successfully." };
    }

    return await leadResponse.json();
  }
);


// Exported functions to be called from the frontend
export async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
    return getSalesforceTokenFlow();
}

export async function insertLead(input: InsertLeadInput): Promise<any> {
    return insertLeadFlow(input);
}

export async function updateLead(input: UpdateLeadInput): Promise<any> {
    return updateLeadFlow(input);
}
