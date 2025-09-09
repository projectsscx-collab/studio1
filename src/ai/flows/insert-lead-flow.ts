'use server';

/**
 * @fileoverview Genkit flows to create and update a lead in Salesforce.
 * These flows now act as simple proxies, receiving a fully constructed payload
 * from the client and forwarding it to Salesforce.
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


// --- Consolidated Flow to SUBMIT/UPSERT the lead ---
const submitLeadFlow = ai.defineFlow(
  {
    name: 'submitLeadFlow',
    inputSchema: z.object({
      leadPayload: z.any(), // The payload is now built on the client
      token: SalesforceTokenResponseSchema,
    }),
    outputSchema: z.any(),
  },
  async ({ leadPayload, token }) => {
    const leadResponse = await fetch(`${token.instance_url}/services/apexrest/core/lead/`, {
      method: 'POST', // Salesforce uses POST for both inserts and updates with this APEX class
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPayload),
    });
    
    const responseText = await leadResponse.text();
    // Handle empty response on success, which can happen on updates.
    const responseData = responseText ? JSON.parse(responseText) : { success: true, id: leadPayload.leadWrappers[0].id };

    if (!leadResponse.ok) {
        const errorText = JSON.stringify(responseData);
        console.error("Salesforce Submission Error Response:", errorText);
        throw new Error(`Failed to update lead: ${leadResponse.status} ${errorText}`);
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
