'use server';

/**
 * @fileoverview Genkit flow to insert and update a lead in Salesforce.
 *
 * - insertLead - Creates a new lead in Salesforce.
 * - updateLead - Updates an existing lead, used for subsequent steps.
 * - getSalesforceToken - Handles authentication.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { InsertLeadInputSchema, UpdateLeadInputSchema, SalesforceTokenResponseSchema, type InsertLeadInput, type UpdateLeadInput, type SalesforceTokenResponse } from '@/lib/salesforce-schemas';


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
            sourceEvent: '01', // Default for creation
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

    const responseData = await leadResponse.json();

    if (!leadResponse.ok) {
        const errorText = JSON.stringify(responseData);
        console.error("Salesforce Error Response:", errorText);
        throw new Error(`Failed to insert lead: ${leadResponse.status} ${errorText}`);
    }

    return responseData;
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
      const { accessToken, instanceUrl, idFullOperation, ...updateData } = input;
      
      const riskObject = {
        'Número de matrícula__c': updateData.numero_de_matricula,
        'Marca__c': updateData.marca,
        'Modelo__c': updateData.modelo,
        'Año del vehículo__c': updateData.ano_del_vehiculo,
        'Número de serie__c': updateData.numero_de_serie,
      };

      const leadWrapperBase: any = {
        idFullOperation: idFullOperation,
        // Always include basic data
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        documentType: updateData.documentType,
        documentNumber: updateData.documentNumber,
        birthdate: updateData.birthdate,
        contactData: {
            mobilePhone: updateData.mobilePhone,
            phone: updateData.phone,
            email: updateData.email,
        },
        // Base interest product data
        interestProduct: {
            businessLine: '01',
            sector: 'XX_01',
            subsector: 'XX_00',
            branch: 'XX_205',
            risk: JSON.stringify(riskObject),
            quotes: [{
                id: 'TestWSConvertMIN', // This ID is required by the validation rule
                effectiveDate: updateData.effectiveDate,
                expirationDate: updateData.expirationDate,
                productCode: 'PRD001',
                productName: 'Life Insurance',
                netPremium: 1000.0,
                paymentMethod: updateData.paymentMethod,
                paymentPeriodicity: updateData.paymentPeriodicity,
                paymentTerm: updateData.paymentTerm,
                additionalInformation: 'test',
                isSelected: true,
            }]
        },
        sourceData: {}, // Initialize sourceData
        utmData: {}, // Initialize utmData
      };

      // Add contact preference data if present (Step 4)
      if (updateData.sourceEvent) {
        leadWrapperBase.sourceData.sourceEvent = updateData.sourceEvent;
      }
       if (updateData.systemOrigin) {
        leadWrapperBase.sourceData.systemOrigin = updateData.systemOrigin;
       }
       if (updateData.origin) {
        leadWrapperBase.sourceData.origin = updateData.origin;
       }
       if (updateData.leadSource) {
        leadWrapperBase.sourceData.leadSource = updateData.leadSource;
       }
       if (updateData.utmCampaign) {
        leadWrapperBase.utmData.utmCampaign = updateData.utmCampaign;
       }

      // Add emission data if present (Step 5)
      if (updateData.convertedStatus) {
        leadWrapperBase.idOwner = updateData.idOwner; // Add idOwner for conversion
        leadWrapperBase.conversionData = {
          convertedStatus: updateData.convertedStatus,
          policyNumber: updateData.policyNumber,
        };
      }
  
      const updatePayload = {
        leadWrappers: [leadWrapperBase],
      };
  
      const leadResponse = await fetch(`${instanceUrl}/services/apexrest/core/lead/`, {
          method: 'POST', // Salesforce uses POST for this upsert logic
          headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
      });
  
        const responseData = await leadResponse.json();

        if (!leadResponse.ok) {
            const errorText = JSON.stringify(responseData);
            console.error("Salesforce Update Error Response:", errorText);
            throw new Error(`Failed to update lead: ${leadResponse.status} ${errorText}`);
        }
      
        // Handle no-content response
        if (leadResponse.status === 204) {
            return { success: true, idFullOperation };
        }
  
      return responseData;
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
