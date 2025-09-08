'use server';

/**
 * @fileoverview Genkit flow to upsert a lead in Salesforce.
 *
 * This file contains a unified flow for both creating and updating a lead.
 * The term "upsert" means it will create a new record if one doesn't exist,
 * or update an existing one if it does, based on the FullOperationId__c field.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  LeadWrapperSchema,
  SalesforceTokenResponseSchema,
  type LeadWrapperData,
  type SalesforceTokenResponse,
} from '@/lib/salesforce-schemas';

// Flow to get the authentication token
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

// Unified flow to create or update the lead
const upsertLeadFlow = ai.defineFlow(
  {
    name: 'upsertLeadFlow',
    inputSchema: z.object({
      formData: LeadWrapperSchema,
      token: SalesforceTokenResponseSchema,
    }),
    outputSchema: z.any(),
  },
  async ({ formData, token }) => {
    const {
      accessToken,
      instanceUrl,
      agentType, // Not sent to Salesforce
      ...payloadData
    } = { ...formData, ...token };

    const riskObject = {
      'Número de matrícula__c': payloadData.numero_de_matricula,
      'Marca__c': payloadData.marca,
      'Modelo__c': payloadData.modelo,
      'Año del vehículo__c': payloadData.ano_del_vehiculo,
      'Número de serie__c': payloadData.numero_de_serie,
    };

    const leadWrapper = {
      id: payloadData.id,
      idFullOperation: payloadData.idFullOperation,
      idOwner: payloadData.idOwner,

      // Personal & Contact Data
      firstName: payloadData.firstName,
      lastName: payloadData.lastName,
      documentType: payloadData.documentType,
      documentNumber: payloadData.documentNumber,
      birthdate: payloadData.birthdate,
      contactData: {
        mobilePhone: payloadData.mobilePhone,
        phone: payloadData.phone,
        email: payloadData.email,
      },

      // Product & Quote Data
      interestProduct: {
        businessLine: '01',
        sector: 'XX_01',
        subsector: 'XX_00',
        branch: 'XX_205',
        risk: JSON.stringify(riskObject),
        quotes: [{
          id: 'TestWSConvertMIN', // Static ID for validation
          effectiveDate: payloadData.effectiveDate,
          expirationDate: payloadData.expirationDate,
          productCode: 'PRD001',
          productName: 'Life Insurance',
          netPremium: 1000.0,
          paymentMethod: payloadData.paymentMethod,
          paymentPeriodicity: payloadData.paymentPeriodicity,
          paymentTerm: payloadData.paymentTerm,
          additionalInformation: 'test',
          isSelected: true,
        }],
      },

      // Source & Campaign Data
      sourceData: {
        sourceEvent: payloadData.sourceEvent,
        leadSource: payloadData.leadSource,
        origin: payloadData.origin,
        systemOrigin: payloadData.systemOrigin,
        // Default values for creation
        eventReason: '01',
        sourceSite: 'Website',
        deviceType: '01',
        deviceModel: 'iPhone',
        ipData: {},
      },
      utmData: {
        utmCampaign: payloadData.utmCampaign,
      },

      // Conversion Data
      conversionData: payloadData.convertedStatus ? {
        convertedStatus: payloadData.convertedStatus,
        policyNumber: payloadData.policyNumber,
      } : undefined,
    };

    const finalPayload = { leadWrappers: [leadWrapper] };

    const leadResponse = await fetch(`${instanceUrl}/services/apexrest/core/lead/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });
    
    const responseText = await leadResponse.text();

    // Handle empty response for success (e.g., HTTP 204 No Content)
    if (leadResponse.ok && (leadResponse.status === 204 || responseText.length === 0)) {
        // If it was an update with no content, we must return the ID we already have
        return { success: true, idFullOperation: payloadData.idFullOperation };
    }
    
    const responseData = JSON.parse(responseText);

    if (!leadResponse.ok) {
      const errorText = JSON.stringify(responseData);
      console.error("Salesforce Error Response:", errorText);
      throw new Error(`Failed to upsert lead: ${leadResponse.status} ${errorText}`);
    }

    return responseData;
  }
);

// Exported functions to be called from the frontend
export async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
  return getSalesforceTokenFlow();
}

export async function upsertLead(formData: LeadWrapperData, token: SalesforceTokenResponse): Promise<any> {
  return upsertLeadFlow({ formData, token });
}
