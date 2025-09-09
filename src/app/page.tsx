'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PersonalDetailsForm from '@/components/forms/personal-details-form';
import VehicleDetailsForm from '@/components/forms/vehicle-details-form';
import QuoteForm from '@/components/forms/quote-form';
import ContactPreferenceForm from '@/components/forms/contact-preference-form';
import EmissionForm from '@/components/forms/emission-form';
import SubmissionConfirmation from '@/components/forms/submission-confirmation';
import FormStepper from '@/components/form-stepper';
import { insertLead, updateLead, getSalesforceToken } from '@/ai/flows/insert-lead-flow';
import type { FormData } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 5;

const calculateFullOperationId = () => {
    return Date.now().toString() + "IS";
};

const initialFormData: FormData = {
  // --- Salesforce IDs ---
  id: null,
  idFullOperation: '',

  // --- Step 1: Personal Details ---
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  birthdate: '',
  
  // Contact Data
  mobilePhone: '',
  phone: '',
  email: '',
  
  // --- Step 2: Vehicle Details ---
  numero_de_matricula: '',
  marca: '',
  modelo: '',
  ano_del_vehiculo: '',
  numero_de_serie: '',

  // --- Step 3: Quote Details ---
  effectiveDate: '',
  expirationDate: '',
  paymentMethod: '',
  paymentPeriodicity: '',
  paymentTerm: '',
  
  // --- Step 4: Contact Preference ---
  agentType: '', // Frontend only field for agent logic
  
  // --- Step 5: Emission ---
  convertedStatus: '',
  policyNumber: '',

  // --- STATIC OR DERIVED DATA ---
  // These will be set in buildLeadPayload
  utmCampaign: '',
  leadSource: '',
  origin: '',
  systemOrigin: '',
  sourceEvent: '01', // Default value
};

interface SalesforceIds {
    id: string;
    idFullOperation: string;
}

// This function now lives on the client to be used by the preview and submissions
const buildLeadPayload = (formData: FormData, isFinalSubmission: boolean) => {
    const riskObject = {
        'numero_de_matricula': formData.numero_de_matricula,
        'marca': formData.marca,
        'modelo': formData.modelo,
        'ano_del_vehiculo': formData.ano_del_vehiculo,
        'numero_de_serie': formData.numero_de_serie,
    };

    let leadWrapper: any;

    if (isFinalSubmission) {
        // FINAL PAYLOAD STRUCTURE (for conversion)
        leadWrapper = {
            id: formData.id,
            idFullOperation: formData.idFullOperation,
            firstName: formData.firstName,
            lastName: formData.lastName,
            documentType: formData.documentType,
            documentNumber: formData.documentNumber,
            birthdate: formData.birthdate,
            contactData: {
                mobilePhone: formData.mobilePhone,
                phone: formData.phone,
                email: formData.email,
                address: {
                    street: "123 Main St",
                    postalCode: "12345",
                    city: "Puerto Rico",
                    district: "Test",
                    municipality: "Test",
                    state: "XX",
                    country: "PR",
                    colony: "Central Park"
                }
            },
            interestProduct: {
                businessLine: "01",
                sector: "XX_01",
                subsector: "XX_00",
                branch: "XX_205",
                risk: JSON.stringify(riskObject),
                quotes: [{
                    id: "TestWSConvertMIN", // Required for the final update
                    effectiveDate: formData.effectiveDate,
                    expirationDate: formData.expirationDate,
                    paymentMethod: formData.paymentMethod,
                    paymentPeriodicity: formData.paymentPeriodicity,
                    paymentTerm: formData.paymentTerm,
                }]
            },
            utmData: {
                utmCampaign: formData.utmCampaign // This is now dynamically set
            },
            sourceData: {
                sourceEvent: formData.sourceEvent,
                eventReason: "01",
                sourceSite: "Website",
                deviceType: "01",
                deviceModel: "iPhone",
                leadSource: formData.leadSource, // Dynamic
                origin: formData.origin, // Dynamic
                systemOrigin: formData.systemOrigin, // Dynamic
            },
            conversionData: {
                convertedStatus: "02",
                policyNumber: formData.policyNumber // Set to leadId
            }
        };
    } else {
        // INITIAL PAYLOAD STRUCTURE (for creation)
        leadWrapper = {
            id: null,
            idFullOperation: formData.idFullOperation, // Ensure this is sent on creation
            firstName: formData.firstName,
            lastName: formData.lastName,
            documentType: formData.documentType,
            documentNumber: formData.documentNumber,
            birthdate: formData.birthdate,
            contactData: {
                mobilePhone: formData.mobilePhone,
                phone: formData.phone,
                email: formData.email,
            },
            interestProduct: {
                businessLine: "01",
                sector: "XX_01",
                subsector: "XX_00",
                branch: "XX_205",
                risk: JSON.stringify(riskObject),
                quotes: [{
                    id: "TestWSConvertMIN",
                    effectiveDate: formData.effectiveDate,
                    expirationDate: formData.expirationDate,
                    productCode: "PRD001",
                    productName: "Life Insurance",
                    netPremium: 1000,
                    paymentMethod: formData.paymentMethod,
                    isSelected: true,
                    paymentPeriodicity: formData.paymentPeriodicity,
                    paymentTerm: formData.paymentTerm,
                    additionalInformation: "test"
                }]
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
            }
        };
    }
  
    return { leadWrappers: [leadWrapper] };
};


export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [salesforceIds, setSalesforceIds] = useState<SalesforceIds | null>(null);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  
  const { toast } = useToast();
  
  const findKey = (obj: any, keyToFind: string): string | null => {
    if (obj === null || typeof obj !== 'object') return null;
    if (keyToFind in obj) return obj[keyToFind];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const found = findKey(obj[key], keyToFind);
        if (found) return found;
      }
    }
    return null;
  };

  const handleNextStep = (data: Partial<FormData>) => {
    setDirection(1);
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < TOTAL_STEPS + 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleInitialSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    const newIdFullOperation = calculateFullOperationId();
    
    // Create the full data object for this submission
    const submissionData: FormData = { 
        ...formData, 
        ...data,
        idFullOperation: newIdFullOperation,
    };
    
    // Build the specific payload for the initial creation
    const leadPayload = buildLeadPayload(submissionData, false);

    try {
        const token = await getSalesforceToken();
        const response = await insertLead(leadPayload, token);
        
        const error = findKey(response, 'errorMessage');
        if (error) throw new Error(error);

        const leadId = findKey(response, 'leadResultId');
        if (!leadId) throw new Error('Lead ID not found in Salesforce response.');
        
        const newIds = { id: leadId, idFullOperation: newIdFullOperation };

        // Update the central state with ALL data, including the new IDs
        setSalesforceIds(newIds);
        setFormData(prev => ({...prev, ...data, ...newIds }));
        
        handleNextStep(data);

    } catch(error) {
        console.error('Error creating lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error al Crear el Lead',
          description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<FormData>) => {
    if (!salesforceIds) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado.' });
        return;
    }
    setIsSubmitting(true);

    const baseData = { ...formData, ...data, ...salesforceIds };
    
    // This is where we set the dynamic values based on agentType
    let updatedData: FormData;
    
    if (data.agentType === 'APM') {
      updatedData = {
        ...baseData,
        systemOrigin: '02',
        origin: '02',
        utmCampaign: 'ROPO_APMCampaign',
        leadSource: '02',
      };
    } else if (data.agentType === 'ADM') {
      updatedData = {
        ...baseData,
        systemOrigin: '06',
        origin: '02',
        utmCampaign: 'ROPO_ADMCampaign',
        leadSource: '10',
      };
    } else { // Default to Contact Center (CC) or if no agent is selected
      updatedData = {
        ...baseData,
        systemOrigin: '05',
        origin: '01',
        utmCampaign: 'Winter2024', // Default campaign
        leadSource: '01',
      }
    }
    
    // For step 4, we don't send a payload, we just update local state
    // and move to the next step. The final payload is sent in handleFinalSubmit.
    setFormData(updatedData);
    setIsSubmitting(false); // We're not actually submitting here
    handleNextStep(data);
  };
  
  const handleFinalSubmit = async (data: Partial<FormData>) => {
      if (!salesforceIds) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado.' });
        return;
      }
      setIsSubmitting(true);
      
      const finalData: FormData = {
          ...formData,
          ...data,
          ...salesforceIds,
          convertedStatus: '02',
          policyNumber: salesforceIds.id, // Set policyNumber to the lead ID
      };

      const leadPayload = buildLeadPayload(finalData, true);

      try {
          const token = await getSalesforceToken();
          const response = await updateLead(leadPayload, token);
          
          const error = findKey(response, 'errorMessage');
          if (error) {
            throw new Error(error);
          }

          setSubmissionResponse(response);
          setFormData(finalData);
          handleNextStep(data);

      } catch (error) {
          console.error('Error finalizing lead:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
          toast({
              variant: 'destructive',
              title: 'Error al Finalizar',
              description: errorMessage,
          });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStartOver = () => {
    setDirection(1);
    setFormData(initialFormData);
    setSalesforceIds(null);
    setSubmissionResponse(null);
    setCurrentStep(1);
    setIsSubmitting(false);
  };
  
  const formVariants = {
    hidden: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: { duration: 0.5, ease: 'easeInOut' },
    }),
  };

  const renderStep = () => {
    // Combine all available data for the form props
    const combinedData = { ...formData, ...(salesforceIds || {}) };
    
    // Determine which payload structure to use for the preview
    // The initial creation payload is used for steps 1, 2, 3.
    // The final conversion payload is used for steps 4, 5.
    const isFinalFlow = currentStep >= 4; 
    
    const formProps = {
        initialData: combinedData,
        isSubmitting: isSubmitting,
        buildPreviewPayload: (data: any) => buildLeadPayload({ ...combinedData, ...data }, isFinalFlow)
    };

    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} {...formProps} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleUpdate} onBack={handlePrev} {...formProps} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} {...formProps} />;
      case 6:
        return <SubmissionConfirmation onStartOver={handleStartOver} response={submissionResponse} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-grow flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl bg-card p-8 rounded-lg shadow-md mt-4">
          <header className="flex flex-col items-center justify-center mb-8">
            <FormStepper 
              currentStep={Math.min(currentStep, TOTAL_STEPS)} 
              totalSteps={TOTAL_STEPS} 
            />
          </header>

          <main className="relative min-h-[700px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute w-full"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

    