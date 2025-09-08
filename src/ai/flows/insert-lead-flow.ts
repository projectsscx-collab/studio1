'use server';

/**
 * @fileoverview A Genkit flow to insert and update a lead in Salesforce.
 *
 * - insertLead - A function that orchestrates data submission to Salesforce for new leads.
 * - updateLead - A function that updates an existing lead.
 * - getSalesforceToken - A function that handles authentication.
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

  // Form data from initial steps
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
    // Auth and identification
    accessToken: z.string(),
    instanceUrl: z.string(),
    leadId: z.string(),

    // Optional fields for update
    sourceEvent: z.string().optional(),
    agentType: z.string().optional(),
    convertedStatus: z.string().optional(),

    // Required fields from previous steps for context
    firstName: z.string(),
    lastName: z.string(),
    birthdate: z.string(),
    documentType: z.string(),
    documentNumber: z.string(),
    mobilePhone: z.string(),
    phone: z.string(),
    email: z.string(),
    numero_de_matricula: z.string(),
    marca: z.string(),
    modelo: z.string(),
    ano_del_vehiculo: z.string(),
    numero_de_serie: z.string(),
    effectiveDate: z.string(),
    expirationDate: z.string(),
    paymentMethod: z.string(),
    paymentPeriodicity: z.string(),
    paymentTerm: z.string(),
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
    
    const leadPayload = {
      leadWrappers: [{
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthdate: formData.birthdate,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
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
            risk: JSON.stringify({
                'Número de matrícula__c': formData.numero_de_matricula,
                'Marca__c': formData.marca,
                'Modelo__c': formData.modelo,
                'Año del vehículo__c': formData.ano_del_vehiculo,
                'Número de serie__c': formData.numero_de_serie,
            }),
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
        const { accessToken, instanceUrl, leadId, ...formData } = input;
        
        let utmCampaign = 'ROPO_Auto';
        if (formData.agentType === 'APM') {
            utmCampaign = 'ROPO_APMCampaign';
        } else if (formData.agentType === 'ADM') {
            utmCampaign = 'ROPO_ADMCampaign';
        }

        // Base structure for the update payload
        const updatePayload: any = {
            leadWrappers: [{
                id: leadId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                birthdate: formData.birthdate,
                documentType: formData.documentType,
                documentNumber: formData.documentNumber,
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
                    risk: JSON.stringify({
                        'Número de matrícula__c': formData.numero_de_matricula,
                        'Marca__c': formData.marca,
                        'Modelo__c': formData.modelo,
                        'Año del vehículo__c': formData.ano_del_vehiculo,
                        'Número de serie__c': formData.numero_de_serie,
                    }),
                    quotes: [{
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
                    }],
                },
                sourceData: {
                    sourceEvent: formData.sourceEvent || '01',
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
                    utmCampaign: utmCampaign,
                },
            }],
        };

        const leadWrapper = updatePayload.leadWrappers[0];

        // Dynamically adjust sourceData based on agentType
        if (formData.agentType === 'APM') {
            leadWrapper.sourceData.systemOrigin = '02';
            leadWrapper.sourceData.origin = '02';
            leadWrapper.sourceData.leadSource = '02';
        } else if (formData.agentType === 'ADM') {
            leadWrapper.sourceData.systemOrigin = '06';
            leadWrapper.sourceData.origin = '02';
            leadWrapper.sourceData.leadSource = '10';
        }
        
        // Add conversionData only if convertedStatus is provided
        if (formData.convertedStatus) {
            leadWrapper.conversionData = {
                convertedStatus: formData.convertedStatus
            };
        }

        const leadResponse = await fetch(`${instanceUrl}/services/apexrest/core/lead/${leadId}`, {
            method: 'POST', 
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
