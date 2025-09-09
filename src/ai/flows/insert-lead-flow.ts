'use server';

/**
 * @fileoverview Genkit flows to create and update a lead in Salesforce.
 * - insertLead: Creates a new lead with initial data.
 * - updateLead: Updates an existing lead, used for agent selection and final conversion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  SalesforceTokenResponseSchema,
  InsertLeadInputSchema,
  UpdateLeadInputSchema,
  type SalesforceTokenResponse,
  type InsertLeadInput,
  type UpdateLeadInput,
} from '@/lib/salesforce-schemas';

// --- Flow to get the authentication token ---
const getSalesforceTokenFlow = ai.defineFlow(
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Salesforce login failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }
);


// --- Helper function to build the lead wrapper based on the provided final JSON structure ---
const buildLeadWrapper = (formData: InsertLeadInput | UpdateLeadInput) => {
    
    const isFinalConversion = 'convertedStatus' in formData && formData.convertedStatus === '02';

    const riskObject = {
        'numero_de_matricula': formData.numero_de_matricula,
        'marca': formData.marca,
        'modelo': formData.modelo,
        'ano_del_vehiculo': formData.ano_del_vehiculo,
        'numero_de_serie': formData.numero_de_serie,
    };
  
    // Base leadWrapper structure
    const leadWrapper: any = {
        id: formData.id,
        idFullOperation: formData.idFullOperation,
        firstName: formData.firstName,
        lastName: formData.lastName,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        birthdate: formData.birthdate,
        
        contactData: {
            mobilePhone: formData.mobilePhone,
            phone: formData.phone,
            email: formData.email,
            address: {
                street: formData.street,
                postalCode: formData.postalCode,
                city: formData.city,
                district: formData.district,
                municipality: formData.municipality,
                state: formData.state,
                country: formData.country,
                colony: formData.colony,
            },
        },
      
        interestProduct: {
            businessLine: formData.businessLine,
            sector: formData.sector,
            subsector: formData.subsector,
            branch: formData.branch,
            risk: JSON.stringify(riskObject),
            quotes: [
              {
                effectiveDate: formData.effectiveDate,
                expirationDate: formData.expirationDate,
                paymentMethod: formData.paymentMethod,
                paymentPeriodicity: formData.paymentPeriodicity,
                paymentTerm: formData.paymentTerm,
              }
            ]
        },

        riskDetail: JSON.stringify(riskObject),

        utmData: {
            utmCampaign: formData.utmCampaign,
        },

        sourceData: {
            sourceEvent: formData.sourceEvent,
            eventReason: formData.eventReason,
            sourceSite: formData.sourceSite,
            deviceType: formData.deviceType,
            deviceModel: formData.deviceModel,
            leadSource: formData.leadSource,
            origin: formData.origin,
            systemOrigin: formData.systemOrigin,
        },
    };
  
    // Add conversion data only for the final step
    if (isFinalConversion) {
      leadWrapper.conversionData = {
        convertedStatus: formData.convertedStatus,
        policyNumber: formData.policyNumber, 
      };
    }
    
    // Add fields that are not needed in the final payload but are needed for initial/update calls
    if (!isFinalConversion) {
        leadWrapper.idOwner = formData.idOwner;
        leadWrapper.company = formData.company;
        leadWrapper.additionalInformation = formData.additionalInformation;
        leadWrapper.interestProduct.quotes[0].id = "TestPSLead";
        leadWrapper.interestProduct.quotes[0].issueDate = "2024-02-01";
        leadWrapper.interestProduct.quotes[0].dueDate = "2025-01-01";
        leadWrapper.interestProduct.quotes[0].productCode = "PRD001";
        leadWrapper.interestProduct.quotes[0].productName = "Life Insurance";
        leadWrapper.interestProduct.quotes[0].netPremium = 1000.00;
        leadWrapper.interestProduct.quotes[0].totalPremium = 1200.00;
        leadWrapper.interestProduct.quotes[0].currencyIsoCode = "EUR";
        leadWrapper.interestProduct.quotes[0].isSelected = true;
        leadWrapper.interestProduct.quotes[0].discount = "0.24";
        leadWrapper.interestProduct.quotes[0].additionalInformation = "test";
    }


    // Salesforce throws an error if an empty string or null is passed for the ID on creation.
    if (!leadWrapper.id) {
        delete leadWrapper.id;
    }
  
    return leadWrapper;
};


// --- Flow to CREATE the lead (called from Step 3) ---
const insertLeadFlow = ai.defineFlow(
  {
    name: 'insertLeadFlow',
    inputSchema: z.object({
      formData: InsertLeadInputSchema,
      token: SalesforceTokenResponseSchema,
    }),
    outputSchema: z.any(),
  },
  async ({ formData, token }) => {
    const leadWrapper = buildLeadWrapper(formData);
    const finalPayload = { leadWrappers: [leadWrapper] };

    const leadResponse = await fetch(`${token.instance_url}/services/apexrest/core/lead/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });
    
    const responseData = await leadResponse.json();

    if (!leadResponse.ok) {
      const errorText = JSON.stringify(responseData);
      console.error("Salesforce Insert Error Response:", errorText);
      throw new Error(`Failed to create lead: ${leadResponse.status} ${errorText}`);
    }

    return responseData;
  }
);


// --- Flow to UPDATE the lead (called from Step 4 & 5) ---
const updateLeadFlow = ai.defineFlow(
  {
    name: 'updateLeadFlow',
    inputSchema: z.object({
      formData: UpdateLeadInputSchema,
      token: SalesforceTokenResponseSchema,
    }),
    outputSchema: z.any(),
  },
  async ({ formData, token }) => {
    const leadWrapper = buildLeadWrapper(formData);
    const finalPayload = { leadWrappers: [leadWrapper] };

    const leadResponse = await fetch(`${token.instance_url}/services/apexrest/core/lead/`, {
      method: 'POST', // Salesforce uses POST for updates with this APEX class
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    const responseText = await leadResponse.text();
    // Handle empty response on success, which can happen on updates.
    const responseData = responseText ? JSON.parse(responseText) : { success: true, id: formData.id };
    
    if (!leadResponse.ok) {
      const errorText = JSON.stringify(responseData);
      console.error("Salesforce Update Error Response:", errorText);
      throw new Error(`Failed to update lead: ${leadResponse.status} ${errorText}`);
    }
  
    return responseData;
  }
);


// --- Exported functions to be called from the frontend ---
export async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
  return getSalesforceTokenFlow();
}

export async function insertLead(formData: InsertLeadInput, token: SalesforceTokenResponse): Promise<any> {
  return insertLeadFlow({ formData, token });
}

export async function updateLead(formData: UpdateLeadInput, token: SalesforceTokenResponse): Promise<any> {
  return updateLeadFlow({ formData, token });
}

    