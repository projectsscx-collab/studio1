'use server';

/**
 * @fileoverview A Genkit flow to insert a lead into Salesforce.
 *
 * - insertLead - A function that orchestrates authentication and data submission to Salesforce.
 * - InsertLeadInput - The input type for the insertLead function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { leadSchema } from '@/lib/schemas';

const InsertLeadInputSchema = leadSchema;

export type InsertLeadInput = z.infer<typeof InsertLeadInputSchema>;

async function getSalesforceToken(): Promise<{
  accessToken: string;
  instanceUrl: string;
}> {
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
  return {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
  };
}

export const insertLeadFlow = ai.defineFlow(
  {
    name: 'insertLeadFlow',
    inputSchema: InsertLeadInputSchema,
    outputSchema: z.any(),
  },
  async (input) => {
    const { accessToken, instanceUrl } = await getSalesforceToken();
    const leadPayload = {
        leadWrappers: [
            {
                firstName: input.firstName,
                lastName: input.lastName,
                documentType: input.documentType,
                documentNumber: input.documentNumber,
                birthdate: input.birthdate,
                contactData: {
                    mobilePhone: input.mobilePhone,
                    phone: input.phone,
                    email: input.email,
                },
                interestProduct: {
                    businessLine: "01",
                    sector: "XX_01",
                    subsector: "XX_00",
                    branch: "XX_205",
                    risk: JSON.stringify({
                        "Número de matrícula__c": input.numero_de_matricula,
                        "Marca__c": input.marca,
                        "Modelo__c": input.modelo,
                        "Año del vehículo__c": input.ano_del_vehiculo,
                        "Número de serie__c": input.numero_de_serie
                    }),
                    quotes: [
                        {
                            id: "TestWSConvertMIN",
                            effectiveDate: input.effectiveDate,
                            expirationDate: input.expirationDate,
                            productCode: "PRD001",
                            productName: "Life Insurance",
                            netPremium: 1000.00,
                            paymentMethod: input.paymentMethod,
                            isSelected: true,
                            paymentPeriodicity: input.paymentPeriodicity,
                            paymentTerm: input.paymentTerm,
                            additionalInformation: "test"
                        }
                    ]
                },
                utmData: {
                    utmCampaign: "ROPO_Auto"
                },
                sourceData: {
                    sourceEvent: "01",
                    eventReason: "01",
                    sourceSite: "Website",
                    deviceType: "01",
                    deviceModel: "iPhone",
                    leadSource: "01",
                    origin: "01",
                    systemOrigin: "05",
                    ipData: {}
                },
            },
        ],
    };

    const leadResponse = await fetch(`${instanceUrl}/services/apexrest/core/lead/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadPayload)
    });

    if (!leadResponse.ok) {
        const errorText = await leadResponse.text();
        console.error("Salesforce Error Response:", errorText);
        throw new Error(`Failed to insert lead: ${leadResponse.status} ${errorText}`);
    }

    return await leadResponse.json();
  }
);

export async function insertLead(input: InsertLeadInput): Promise<any> {
    return insertLeadFlow(input);
}
