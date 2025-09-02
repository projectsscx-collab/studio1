'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { demographicInfoSchema, type DemographicInfoData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AiAssistant from '@/components/ai-assistant';
import { Loader2 } from 'lucide-react';

interface DemographicInfoFormProps {
  onSubmit: (data: DemographicInfoData) => void;
  onBack: () => void;
  initialData: Partial<DemographicInfoData>;
  isSubmitting: boolean;
}

const maritalStatuses = ["Single", "Married", "Divorced", "Widowed", "Separated"];
const employmentStatuses = ["Employed", "Unemployed", "Self-employed", "Student", "Retired"];
const educationLevels = ["High School", "Some College", "Bachelor's Degree", "Master's Degree", "Doctorate (PhD)", "Other"];

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


const DemographicInfoForm = ({ onSubmit, onBack, initialData, isSubmitting }: DemographicInfoFormProps) => {
  const form = useForm<DemographicInfoData>({
    resolver: zodResolver(demographicInfoSchema),
    defaultValues: {
      gender: 'prefer-not-to-say',
      maritalStatus: '',
      employmentStatus: '',
      educationLevel: '',
      ...initialData,
    },
    mode: 'onChange',
  });
  const { watch, handleSubmit } = form;

  const currentValues = watch();
  const fieldNames = Object.keys(demographicInfoSchema.shape);

  // This combines all data from previous steps and the current step
  const finalData = { ...initialData, ...currentValues };
  
  // Construct the final payload for display
   const leadPayload = {
      leadWrappers: [
        {
          id: null,
          idFullOperation: "GENERATED_ON_SUBMIT",
          idOwner: '005D700000GSthDIAT',
          firstName: finalData.firstName,
          lastName: finalData.lastName,
          documentType: finalData.documentType, 
          documentNumber: finalData.documentNumber,
          birthdate: finalData.dateOfBirth,
          sex: genderMapping[finalData.gender || 'prefer-not-to-say'] || '04',
          maritalStatus: maritalStatusMapping[finalData.maritalStatus || ''] || '01',
          additionalInformation: 'test',
          contactData: {
            mobilePhone: finalData.phone,
            phone: finalData.phone,
            email: finalData.email,
            address: {
              street: finalData.address,
              postalCode: finalData.zip,
              city: 'Puerto Rico', // Hardcoded as per Postman
              district: "Test",
              municipality: "Test",
              state: finalData.state,
              country: finalData.country,
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


  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
              <CardTitle>Demographic Information</CardTitle>
              <CardDescription>This information helps us tailor our services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                  <FormItem className="space-y-3">
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="male" /></FormControl>
                          <FormLabel className="font-normal">Male</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="female" /></FormControl>
                          <FormLabel className="font-normal">Female</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="non-binary" /></FormControl>
                          <FormLabel className="font-normal">Non-binary</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="prefer-not-to-say" /></FormControl>
                          <FormLabel className="font-normal">Prefer not to say</FormLabel>
                      </FormItem>
                      </RadioGroup>
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                          {maritalStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="employmentStatus"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Employment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                          {employmentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              </div>
              <FormField
              control={form.control}
              name="educationLevel"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Highest Level of Education</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                      <SelectContent>
                      {educationLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />

              <div className="space-y-2">
                  <label className="text-sm font-medium">JSON to Submit</label>
                  <pre className="p-4 bg-secondary rounded-md text-xs overflow-auto h-64">
                      {JSON.stringify(leadPayload, null, 2)}
                  </pre>
              </div>
          </CardContent>
          <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
              <AiAssistant
                  formType="Demographic Information"
                  currentFields={Object.fromEntries(Object.entries(currentValues).filter(([_, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))}
                  fieldNames={fieldNames}
              />
              <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default DemographicInfoForm;
