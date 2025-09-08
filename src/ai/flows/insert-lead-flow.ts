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
      const { accessToken, instanceUrl, idFullOperation, id, ...updateData } = input;
      
      const riskObject = {
        'Número de matrícula__c': updateData.numero_de_matricula,
        'Marca__c': updateData.marca,
        'Modelo__c': updateData.modelo,
        'Año del vehículo__c': updateData.ano_del_vehiculo,
        'Número de serie__c': updateData.numero_de_serie,
      };

      const leadWrapperBase: any = {
        id: id,
        idFullOperation: idFullOperation, // Ensure this is always passed
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
        interestProduct: {
            businessLine: '01',
            sector: 'XX_01',
            subsector: 'XX_00',
            branch: 'XX_205',
            risk: JSON.stringify(riskObject),
            quotes: [{
                id: 'TestWSConvertMIN', // ID for the quote is required by validation
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
        sourceData: {
            sourceEvent: updateData.sourceEvent,
            systemOrigin: updateData.systemOrigin,
            origin: updateData.origin,
            leadSource: updateData.leadSource,
        },
        utmData: {
            utmCampaign: updateData.utmCampaign
        },
      };
      
      if (updateData.convertedStatus) {
        leadWrapperBase.idOwner = '005D700000GSRhDIAX';
        leadWrapperBase.conversionData = {
          convertedStatus: updateData.convertedStatus,
          policyNumber: updateData.policyNumber,
        };
      }
  
      const updatePayload = {
        leadWrappers: [leadWrapperBase],
      };
  
      const leadResponse = await fetch(`${instanceUrl}/services/apexrest/core/lead/`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
      });
  
      const responseText = await leadResponse.text();
      
      // Handle empty response for success
      if (leadResponse.status === 204 || responseText.length === 0) {
        return { success: true, idFullOperation };
      }

      const responseData = JSON.parse(responseText);

      if (!leadResponse.ok) {
          const errorText = JSON.stringify(responseData);
          console.error("Salesforce Update Error Response:", errorText);
          throw new Error(`Failed to update lead: ${leadResponse.status} ${errorText}`);
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
