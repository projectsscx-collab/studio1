'use server';

/**
 * @fileoverview Genkit flow to UPDATE a Lead in Salesforce using the standard REST API.
 * This flow is called in the final step to update the lead with policy information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SalesforceTokenResponseSchema } from '@/lib/salesforce-schemas';


// --- Flow to get the authentication token (can be defined in a shared file later) ---
const getSalesforceTokenFlow = ai.defineFlow(
  {
    name: 'getSalesforceTokenForLeadUpdateFlow', // Use a different name to avoid collisions
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


const UpdateLeadInputSchema = z.object({
  leadId: z.string(),
  payload: z.object({
    Status: z.string(), // For Leads, the field is 'Status', not 'StageName'
    // Map other opportunity fields to potential custom lead fields if necessary
    // For now, we only update the status and maybe a policy number field.
    PolicyNumber__c: z.string().optional(),
  }),
});

const updateLeadFlow = ai.defineFlow(
  {
    name: 'updateLeadFlow',
    inputSchema: UpdateLeadInputSchema,
    outputSchema: z.any(),
  },
  async ({ leadId, payload }) => {
    const token = await getSalesforceTokenFlow();
    
    // The standard Salesforce REST API endpoint for updating a Lead record.
    const endpoint = `${token.instance_url}/services/data/v61.0/sobjects/Lead/${leadId}`;

    // Salesforce requires a Status for a converted Lead. Let's map "06" to a standard Lead status.
    // This is an assumption. 'Qualified' is a common converted status.
    // The payload needs to be adjusted for the Lead object.
    const leadPayload = {
      Status: 'Qualified', // A standard Lead status. The stage is on the opportunity.
      PolicyNumber__c: payload.PolicyNumber__c,
    };


    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadPayload),
    });

    if (response.status !== 204) { // Successful PATCH returns 204 No Content
      const errorText = await response.text();
      let errorJson = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Ignore if not json
      }
      console.error("Salesforce Lead Update Error Response:", errorText);
      throw new Error(`Failed to update lead: ${response.status} ${errorText}`);
    }

    // A 204 No Content is a successful response for a PATCH request.
    // Return a custom success object as there's no body.
    return { success: true, status: response.status, statusText: response.statusText, leadId: leadId };
  }
);

// --- Exported function to be called from the frontend ---
export async function updateLead(input: z.infer<typeof UpdateLeadInputSchema>): Promise<any> {
  return updateLeadFlow(input);
}
