'use server';

/**
 * @fileoverview A Genkit flow to insert a lead into Salesforce.
 *
 * - insertLead - A function that orchestrates authentication and data submission to Salesforce.
 * - InsertLeadInput - The input type for the insertLead function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  personalDetailsSchema,
  contactDetailsSchema,
  demographicInfoSchema,
} from '@/lib/schemas';
import { format } from 'date-fns';

const InsertLeadInputSchema = personalDetailsSchema
  .merge(contactDetailsSchema)
  .merge(demographicInfoSchema);

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

const genderMapping: Record<string, string> = {
  male: '01',
  female: '02',
  'non-binary': '03',
  'prefer-not-to-say': '04'
};

const maritalStatusMapping: Record<string, string> = {
  "Single": "01",
  "Married": "02",
  "Divorced": "03",
  "Widowed": "04",
  "Separated": "05",
};

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
          id: null,
          idFullOperation: crypto.randomUUID(),
          idOwner: '005D700000GSthDIAT',
          firstName: input.firstName,
          lastName: input.lastName,
          documentType: input.documentType, 
          documentNumber: input.documentNumber,
          birthdate: format(input.dateOfBirth, 'yyyy-MM-dd'),
          sex: genderMapping[input.gender] || '04',
          maritalStatus: maritalStatusMapping[input.maritalStatus] || '01',
          additionalInformation: 'test',
          contactData: {
            mobilePhone: input.phone,
            phone: input.phone,
            email: input.email,
            address: {
              street: input.address,
              postalCode: input.zip,
              city: 'Puerto Rico', // Hardcoded as per Postman
              district: "Test",
              municipality: "Test",
              state: input.state,
              country: input.country,
              colony: "Central Park"
            },
          },
          interestProduct: {
            businessLine: "01",
            sector: "XX_01",
            subsector: "XX_00",
            branch: "XX_205",
            risk: JSON.stringify({
                "Número de matrícula__c": "1234ABC",
                "Marca__c": "MARCA",
                "Modelo__c": "MODELO",
                "Año del vehículo__c": "2000",
                "Número de serie__c": "4164684"
            }),
            quotes: [
              {
                id: "TestWSConvert",
                issueDate: "2024-02-01",
                dueDate: "2025-01-01",
                effectiveDate: "2024-02-01",
                expirationDate: "2025-02-01",
                productCode: "PRD001",
                productName: "Life Insurance",
                netPremium: 1000.00,
                totalPremium: 1200.00,
                paymentMethod: "01",
                currencyIsoCode: "EUR",
                isSelected: true,
                discount: "0.24",
                paymentPeriodicity: "01",
                paymentTerm: "01",
                additionalInformation: "test"
              }
            ]
          },
          commercialStructureData: {
            idIntermediary: null,
            regionalOffice: null,
            managerOffice: null
          },
          qualificationData: {
            scoring: "21",
            rating: "01"
          },
          googleAnalyticsData: {
            gaClientId: "GA12345",
            gaUserId: "User123",
            gaTrackId: "Track123",
            gaTerm: "Insurance",
            gaMedium: "Email"
          },
          utmData: {
            utmCampaign: "ROPO_Auto",
            utmContent: "EmailMarketing",
            utmSource: "Google"
          },
          sourceData: {
            sourceEvent: "01",
            eventReason: "01",
            sourceSite: "Website",
            screenName: "HomePage",
            deviceType: "01",
            deviceModel: "iPhone",
            leadSource: "01",
            origin: "01",
            systemOrigin: "05",
            ipData: {
              ipSubmitter: "Test",
              ipHostName: "Test",
              ipCity: "Test",
              ipRegion: "Test",
              ipCountry: "Test",
              ipPostalCode: "Test",
              ipLocation: "Test",
              ipOrganization: "Test"
            }
          },
          conversionData: {
            convertedStatus: "01",
            policyNumber: null,
            netPremium: null,
            totalPremium: null
          }
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
        throw new Error(`Failed to insert lead: ${leadResponse.status} ${errorText}`);
    }

    return await leadResponse.json();
  }
);

export async function insertLead(input: InsertLeadInput): Promise<any> {
    return insertLeadFlow(input);
}
