'use server';

/**
 * @fileoverview Genkit flow to **CREATE** a lead in Salesforce.
 * This flow handles the initial submission and returns an Opportunity ID.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SalesforceTokenResponseSchema } from '@/lib/salesforce-schemas';
import type { SalesforceTokenResponse } from '@/lib/salesforce-schemas';

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


// --- Flow to SUBMIT the lead ---
const submitLeadFlow = ai.defineFlow(
  {
    name: 'submitLeadFlow',
    inputSchema: z.object({
      leadPayload: z.any(),
      token: SalesforceTokenResponseSchema,
    }),
    outputSchema: z.any(),
  },
  async ({ leadPayload, token }) => {
    const leadResponse = await fetch(`${token.instance_url}/services/apexrest/core/lead/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPayload),
    });
    
    const responseText = await leadResponse.text();
    const responseData = responseText ? JSON.parse(responseText) : {};

    if (!leadResponse.ok) {
        const errorText = JSON.stringify(responseData);
        console.error("Salesforce Submission Error Response:", errorText);
        throw new Error(`Failed to submit lead: ${leadResponse.status} ${errorText}`);
    }

    return responseData;
  }
);


// --- Exported functions to be called from the frontend ---
export async function getSalesforceToken(): Promise<SalesforceTokenResponse> {
  return getSalesforceTokenFlow();
}

export async function submitLead(leadPayload: any, token: SalesforceTokenResponse): Promise<any> {
  return submitLeadFlow({ leadPayload, token });
}
