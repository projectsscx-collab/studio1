'use server';

/**
 * @fileoverview Genkit flow to CREATE a lead in Salesforce by calling the custom Apex REST endpoint.
 * This flow handles the initial submission and returns the full response from Salesforce,
 * which includes the Opportunity ID.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SalesforceTokenResponseSchema } from '@/lib/salesforce-schemas';

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
    }),
    outputSchema: z.any(),
  },
  async ({ leadPayload }) => {
    const token = await getSalesforceTokenFlow();
    
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
    
    // Explicitly parse the response to find the Opportunity ID
    const opportunityId = responseData?.leadResults?.[0]?.leadResultId;

    if (!opportunityId) {
      const errorDetails = JSON.stringify(responseData);
      console.error("Salesforce response did not contain an Opportunity ID. Full response:", errorDetails);
      throw new Error(`Opportunity ID not found in Salesforce response: ${errorDetails}`);
    }

    // Return a clean object with the ID
    return {
      success: true,
      opportunityId: opportunityId,
      fullResponse: responseData, // Keep the full response for logging if needed
    };
  }
);


// --- Exported function to be called from the frontend ---
export async function submitLead(leadPayload: any): Promise<any> {
  return submitLeadFlow({ leadPayload });
}
