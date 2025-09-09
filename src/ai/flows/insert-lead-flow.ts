
'use server';

/**
 * @fileoverview Genkit flow to CREATE or UPDATE a Lead in Salesforce via a custom Apex REST endpoint.
 * This single flow handles both the initial submission (creation) and the final update.
 * The key is that sending a payload with an "id" tells the Apex service to update, 
 * while sending it without an "id" tells it to create.
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


// --- Flow to SUBMIT or UPDATE the lead ---
const submitOrUpdateLeadFlow = ai.defineFlow(
  {
    name: 'submitOrUpdateLeadFlow',
    inputSchema: z.object({
      leadPayload: z.any(),
    }),
    outputSchema: z.any(),
  },
  async ({ leadPayload }) => {
    const token = await getSalesforceTokenFlow();
    
    // This single endpoint is used for both creation and updates.
    const leadResponse = await fetch(`${token.instance_url}/services/apexrest/core/lead/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPayload),
    });
    
    const responseText = await leadResponse.text();
    
    if (!responseText) {
        throw new Error(`Salesforce returned an empty response. Status: ${leadResponse.status}`);
    }
    
    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse Salesforce JSON response: ${responseText}`);
    }

    if (!leadResponse.ok) {
        const errorDetails = JSON.stringify(responseData);
        console.error("Salesforce Submission Error Response:", errorDetails);
        throw new Error(`Failed to submit lead: ${leadResponse.status} ${errorDetails}`);
    }

    // Extract the Lead ID from the response. It's in leadResultId.
    const leadResult = Array.isArray(responseData) ? responseData[0] : responseData;
    const leadId = leadResult?.leadResultId;

    if (!leadId) {
      const errorDetails = JSON.stringify(responseData);
      console.error("Salesforce response did not contain a Lead ID (leadResultId). Full response:", errorDetails);
      throw new Error(`Lead ID not found in Salesforce response: ${errorDetails}`);
    }
    
    // Return a clean object with the Lead ID
    return {
      success: true,
      leadId: leadId, 
      fullResponse: leadResult,
    };
  }
);


// --- Exported function to be called from the frontend ---
// This one function is used for all Salesforce lead interactions.
export async function submitLead(leadPayload: any): Promise<any> {
  return submitOrUpdateLeadFlow({ leadPayload });
}
