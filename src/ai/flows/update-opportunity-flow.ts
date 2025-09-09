'use server';

/**
 * @fileoverview Genkit flow to **UPDATE** an Opportunity in Salesforce.
 * This flow is called in the final step to mark the opportunity as won.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SalesforceTokenResponseSchema } from '@/lib/salesforce-schemas';
import type { SalesforceTokenResponse } from '@/lib/salesforce-schemas';

const UpdateOpportunityInputSchema = z.object({
  opportunityId: z.string(),
  payload: z.object({
    StageName: z.string(),
    CloseDate: z.string(),
    Amount: z.number(),
    PolicyNumber__c: z.string(),
  }),
  token: SalesforceTokenResponseSchema,
});

const updateOpportunityFlow = ai.defineFlow(
  {
    name: 'updateOpportunityFlow',
    inputSchema: UpdateOpportunityInputSchema,
    outputSchema: z.any(),
  },
  async ({ opportunityId, payload, token }) => {
    // The standard Salesforce REST API endpoint for updating a record is used here.
    const endpoint = `${token.instance_url}/services/data/v61.0/sobjects/Opportunity/${opportunityId}`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Ignore if not json
      }
      console.error("Salesforce Opportunity Update Error Response:", errorText);
      throw new Error(`Failed to update opportunity: ${response.status} ${errorText}`);
    }

    // A 204 No Content is a successful response for a PATCH request.
    return { success: true, status: response.status, statusText: response.statusText };
  }
);

// --- Exported function to be called from the frontend ---
export async function updateOpportunity(input: z.infer<typeof UpdateOpportunityInputSchema>): Promise<any> {
  return updateOpportunityFlow(input);
}
