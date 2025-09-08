'use server';

/**
 * @fileoverview Genkit flows to create and update a lead in Salesforce.
 * - insertLead: Creates a new lead with initial data.
 * - updateLead: Updates an existing lead with additional data from subsequent steps.
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
    const riskObject = {
      'Número de matrícula__c': formData.numero_de_matricula,
      'Marca__c': formData.marca,
      'Modelo__c': formData.modelo,
      'Año del vehículo__c': formData.ano_del_vehiculo,
      'Número de serie__c': formData.numero_de_serie,
    };

    const leadWrapper = {
      idFullOperation: formData.idFullOperation,
      // Personal & Contact Data from Step 1
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
      // Product & Quote Data from Step 3
      interestProduct: {
        businessLine: '01',
        sector: 'XX_01',
        subsector: 'XX_00',
        branch: 'XX_205',
        risk: JSON.stringify(riskObject),
        quotes: [{
          id: 'TestWSConvertMIN', // Static ID for validation
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
      // Default Source & Campaign Data
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
    };

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

// --- Flow to UPDATE the lead (called from Steps 4 & 5) ---
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

      // Base structure with the IDs to identify the record
      const leadWrapperBase = {
        id: formData.id,
        idFullOperation: formData.idFullOperation,
        // Always include basic identification data for validation
        firstName: formData.firstName,
        lastName: formData.lastName,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        contactData: {
          mobilePhone: formData.mobilePhone,
          phone: formData.phone,
          email: formData.email,
        },
      };
      
      // Dynamically add data based on what's available in the formData
      const sourceData: any = {};
      if (formData.sourceEvent) sourceData.sourceEvent = formData.sourceEvent;
      if (formData.systemOrigin) sourceData.systemOrigin = formData.systemOrigin;
      if (formData.origin) sourceData.origin = formData.origin;
      if (formData.leadSource) sourceData.leadSource = formData.leadSource;

      const utmData: any = {};
      if (formData.utmCampaign) utmData.utmCampaign = formData.utmCampaign;

      const conversionData: any = {};
      if (formData.convertedStatus) conversionData.convertedStatus = formData.convertedStatus;
      if (formData.policyNumber) conversionData.policyNumber = formData.policyNumber;
       
      const leadWrapper = {
        ...leadWrapperBase,
        ...(Object.keys(sourceData).length > 0 && { sourceData: { ...sourceData, eventReason: '01', sourceSite: 'Website', deviceType: '01', deviceModel: 'iPhone', ipData: {} } }),
        ...(Object.keys(utmData).length > 0 && { utmData }),
        ...(Object.keys(conversionData).length > 0 && { conversionData }),
        ...(formData.idOwner && { idOwner: formData.idOwner }),
      };

      const finalPayload = { leadWrappers: [leadWrapper] };

      const leadResponse = await fetch(`${token.instance_url}/services/apexrest/core/lead/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalPayload),
      });

      // Handle potential empty response for success
      const responseText = await leadResponse.text();
      if (leadResponse.ok && (leadResponse.status === 204 || responseText.length === 0)) {
          return { success: true, idFullOperation: formData.idFullOperation };
      }
      
      if (!responseText) {
        if(leadResponse.ok) return { success: true, idFullOperation: formData.idFullOperation };
        else throw new Error(`Failed to update lead: ${leadResponse.status} Empty error response`);
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
