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
import type { InsertLeadInput, UpdateLeadInput } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 5;

const calculateFullOperationId = () => {
    return Date.now().toString() + "IS";
};

const initialFormData: InsertLeadInput = {
  // --- Salesforce IDs ---
  id: null,
  idFullOperation: '',
  policyNumber: '',

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
  
  // --- Hardcoded / Static Data ---
  idOwner: "005Hs00000HeTcVIAV",
  company: "TestPSLead",
  additionalInformation: "test",
  
  // Address
  street: '123 Main St', 
  postalCode: '12345', 
  city: 'Puerto Rico',
  district: 'Test', 
  municipality: 'Test',
  state: 'XX', 
  country: 'PR',
  colony: 'Central Park',
  
  // Interest Product
  businessLine: "01",
  sector: "XX_01",
  subsector: "XX_00",
  branch: "XX_205",

  // UTM Data (Can be dynamic)
  utmCampaign: "Winter2024",
  utmContent: "EmailMarketing",
  utmSource: "Google",

  // Source Data (Can be dynamic)
  sourceEvent: "01",
  eventReason: "01",
  sourceSite: "Website",
  deviceType: "01",
  deviceModel: "iPhone",
  leadSource: "01",
  origin: "01",
  systemOrigin: "05",
};

interface SalesforceIds {
    id: string;
    idFullOperation: string;
}

// This function now lives on the client to be used by the preview
const buildLeadPayload = (formData: InsertLeadInput | UpdateLeadInput) => {
    const isFinalConversion = 'convertedStatus' in formData && formData.convertedStatus === '02';

    const riskObject = {
        'numero_de_matricula': formData.numero_de_matricula,
        'marca': formData.marca,
        'modelo': formData.modelo,
        'ano_del_vehiculo': formData.ano_del_vehiculo,
        'numero_de_serie': formData.numero_de_serie,
    };
  
    const leadWrapper: any = {
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
              street: formData.street,
              postalCode: formData.postalCode,
              city: formData.city,
              district: formData.district,
              municipality: formData.municipality,
              state: formData.state,
              country: formData.country,
              colony: formData.colony,
          },
      },
    
      interestProduct: {
          businessLine: formData.businessLine,
          sector: formData.sector,
          subsector: formData.subsector,
          branch: formData.branch,
          risk: JSON.stringify(riskObject),
          quotes: [
            {
              effectiveDate: formData.effectiveDate,
              expirationDate: formData.expirationDate,
              paymentMethod: formData.paymentMethod,
              paymentPeriodicity: formData.paymentPeriodicity,
              paymentTerm: formData.paymentTerm,
            }
          ]
      },

      riskDetail: JSON.stringify(riskObject),

      utmData: {
          utmCampaign: formData.utmCampaign,
      },

      sourceData: {
          sourceEvent: formData.sourceEvent,
          eventReason: formData.eventReason,
          sourceSite: formData.sourceSite,
          deviceType: formData.deviceType,
          deviceModel: formData.deviceModel,
          leadSource: formData.leadSource,
          origin: formData.origin,
          systemOrigin: formData.systemOrigin,
      },
    };
  
    if (isFinalConversion) {
      leadWrapper.conversionData = {
        convertedStatus: formData.convertedStatus,
        policyNumber: (formData as UpdateLeadInput).policyNumber, 
      };
    } else {
        // Add fields only needed for initial/update, not final conversion
        leadWrapper.idOwner = formData.idOwner;
        leadWrapper.company = formData.company;
        leadWrapper.additionalInformation = formData.additionalInformation;
        // Salesforce throws an error if an empty string or null is passed for the ID on creation.
        if (!leadWrapper.id) {
            delete leadWrapper.id;
        }
    }
  
    return { leadWrappers: [leadWrapper] };
};


export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InsertLeadInput | UpdateLeadInput>(initialFormData);
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

  const handleNextStep = (data: Partial<InsertLeadInput>) => {
    setDirection(1);
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < TOTAL_STEPS + 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleInitialSubmit = async (data: Partial<InsertLeadInput>) => {
    setIsSubmitting(true);
    const newIdFullOperation = calculateFullOperationId();
    
    const submissionData: InsertLeadInput = { 
        ...formData, 
        ...data,
        idFullOperation: newIdFullOperation,
    };
    
    setFormData(submissionData);
    const leadPayload = buildLeadPayload(submissionData);

    try {
        const token = await getSalesforceToken();
        const response = await insertLead(leadPayload, token);
        
        const error = findKey(response, 'errorMessage');
        if (error) throw new Error(error);

        const leadId = findKey(response, 'leadResultId');
        if (!leadId) throw new Error('Lead ID not found in Salesforce response.');
        
        const newIds = { id: leadId, idFullOperation: newIdFullOperation };
        setSalesforceIds(newIds);
        
        setFormData(prev => ({...prev, ...newIds, idFullOperation: newIdFullOperation }));
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

  const handleUpdate = async (data: Partial<UpdateLeadInput>) => {
    if (!salesforceIds) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado.' });
        return;
    }
    setIsSubmitting(true);
    
    let updatedData: UpdateLeadInput = { 
        ...formData, 
        ...data, 
        ...salesforceIds 
    };
    
    if (data.agentType === 'APM') {
      updatedData = {
        ...updatedData,
        systemOrigin: '02',
        origin: '02',
        utmCampaign: 'ROPO_APMCampaign',
        leadSource: '02',
      };
    } else if (data.agentType === 'ADM') {
      updatedData = {
        ...updatedData,
        systemOrigin: '06',
        origin: '02',
        utmCampaign: 'ROPO_ADMCampaign',
        leadSource: '10',
      };
    } else { // Default to Contact Center (CC)
      updatedData = {
        ...updatedData,
        systemOrigin: '05',
        origin: '01',
        utmCampaign: 'Winter2024',
        leadSource: '01',
      }
    }

    const leadPayload = buildLeadPayload(updatedData);
    
    try {
      const token = await getSalesforceToken();
      await updateLead(leadPayload, token);
      setFormData(updatedData);
      handleNextStep(data);

    } catch(error) {
        console.error('Error updating lead:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error al Actualizar',
          description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleFinalSubmit = async (data: Partial<UpdateLeadInput>) => {
      if (!salesforceIds) {
        toast({ variant: 'destructive', title: 'Error', description: 'Salesforce Lead ID no encontrado.' });
        return;
      }
      setIsSubmitting(true);
      
      const finalData: UpdateLeadInput = {
          ...formData,
          ...data,
          ...salesforceIds,
          convertedStatus: '02',
          policyNumber: salesforceIds.id,
      };

      const leadPayload = buildLeadPayload(finalData);

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
    const combinedData = { ...formData, ...(salesforceIds || {}) };
    // Pass the builder function to the forms for the preview
    const formProps = {
        initialData: combinedData,
        buildPreviewPayload: (data: any) => buildLeadPayload({ ...combinedData, ...data })
    };

    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNextStep} {...formProps} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNextStep} onBack={handlePrev} {...formProps} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} isSubmitting={isSubmitting} {...formProps} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleUpdate} onBack={handlePrev} isSubmitting={isSubmitting} {...formProps} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} isSubmitting={isSubmitting} {...formProps} />;
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
