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
import { insertLead, getSalesforceToken, updateLead } from '@/ai/flows/insert-lead-flow';
import type { InsertLeadInput, UpdateLeadInput } from '@/lib/salesforce-schemas';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

// Definir interfaces para mejor tipado
interface FormData {
  // Step 1 - Personal Details
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthdate: string;
  mobilePhone: string;
  phone: string;
  email: string;
  // Step 2 - Vehicle Details
  numero_de_matricula: string;
  marca: string;
  modelo: string;
  ano_del_vehiculo: string;
  numero_de_serie: string;
  // Step 3 - Quote Details
  effectiveDate: string;
  expirationDate: string;
  paymentMethod: string;
  paymentPeriodicity: string;
  paymentTerm: string;
  // Step 4 - Contact Preference
  sourceEvent: string;
  agentType: string;
  agentId: string;
  additionalInformation: string;
  // Step 5 - Emission
  convertedStatus: string;
  policyNumber: string;
}

const TOTAL_STEPS = 5;
const TOTAL_SCREENS = 6;

const initialFormData: FormData = {
  // Step 1
  firstName: '',
  lastName: '',
  documentType: '',
  documentNumber: '',
  birthdate: '',
  mobilePhone: '',
  phone: '',
  email: '',
  // Step 2
  numero_de_matricula: '',
  marca: '',
  modelo: '',
  ano_del_vehiculo: '',
  numero_de_serie: '',
  // Step 3
  effectiveDate: '',
  expirationDate: '',
  paymentMethod: '',
  paymentPeriodicity: '',
  paymentTerm: '',
  // Step 4
  sourceEvent: '',
  agentType: '',
  agentId: '',
  additionalInformation: '',
  // Step 5
  convertedStatus: '',
  policyNumber: '',
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  const [idFullOperation, setIdFullOperation] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null); // State for the Lead's record ID
  const { toast } = useToast();

  const handleNext = (data: Partial<FormData>) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);

    if (currentStep < TOTAL_SCREENS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFinalSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    const finalData = { ...formData, ...data };
    setFormData(finalData);

    try {
      const token = await getSalesforceToken();
      const payload: UpdateLeadInput = {
        ...finalData,
        accessToken: token.access_token,
        instanceUrl: token.instance_url,
        idFullOperation: idFullOperation!,
        id: leadId!, // Pass the lead record ID
        idOwner: '005D700000GSRhDIAX', 
      };
      
      const response = await updateLead(payload);
      setSubmissionResponse(response);
      handleNext(data);

    } catch (error) {
      console.error('Error submitting final form:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error en la Emisión',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdate = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    let updatedData = { ...formData, ...data };
    
    if (data.agentType === 'APM') {
        updatedData = { ...updatedData, systemOrigin: '02', origin: '02', utmCampaign: 'ROPO_APMCampaign', leadSource: '02' };
    } else if (data.agentType === 'ADM') {
        updatedData = { ...updatedData, systemOrigin: '06', origin: '02', utmCampaign: 'ROPO_ADMCampaign', leadSource: '10' };
    }
    
    setFormData(updatedData);

    try {
      const token = await getSalesforceToken();
      if (!idFullOperation || !leadId) {
        throw new Error('ID de operación o ID de Lead no encontrado para la actualización.');
      }

      const payload: UpdateLeadInput = {
        ...updatedData,
        accessToken: token.access_token,
        instanceUrl: token.instance_url,
        idFullOperation: idFullOperation,
        id: leadId, // Pass the lead record ID
      };
      
      const response = await updateLead(payload);
      console.log('Update successful:', response);
      
      handleNext(data);

    } catch (error) {
      console.error('Error updating form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Hubo un error al actualizar su formulario.';
      toast({
        variant: 'destructive',
        title: 'Fallo en la Actualización',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitialSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      const token = await getSalesforceToken();
      const payload: InsertLeadInput = { ...updatedData, accessToken: token.access_token, instanceUrl: token.instance_url };
      const response = await insertLead(payload);
      
      const leadResult = response[0] ?? {};
      const operationId = leadResult.leadResultId ?? leadResult.idFullOperation; // Assuming idFullOperation might be in the root of the result object
      const newLeadId = leadResult.leadResultId; // The actual record ID
      const error = leadResult.resultErrors?.[0];

      if (error) {
        throw new Error(error.errorMessage ?? 'Ocurrió un error desconocido durante la creación del lead.');
      }
      if (!operationId) {
         // Attempt to find idFullOperation in the response, even if the structure is unexpected
         const foundIdFullOp = findKey(response, 'idFullOperation');
         if(foundIdFullOp){
            setIdFullOperation(foundIdFullOp);
         } else {
            throw new Error('No se recibió un ID de operación de Salesforce.');
         }
      } else {
        setIdFullOperation(operationId);
      }

      if (!newLeadId) {
        // Fallback to search for any key that looks like a Salesforce ID
        const foundLeadId = findKey(response, 'leadResultId');
         if(foundLeadId){
            setLeadId(foundLeadId);
         } else {
            throw new Error('No se recibió un ID de registro de Lead de Salesforce.');
         }
      } else {
          setLeadId(newLeadId);
      }
      
      setSubmissionResponse(response);
      handleNext(data);

    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Hubo un error al enviar su formulario. Por favor, inténtelo de nuevo.';
      toast({ variant: 'destructive', title: 'Fallo en el Envío', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to find a key in a nested object/array structure
    const findKey = (obj: any, keyToFind: string): string | null => {
        if (obj === null || typeof obj !== 'object') {
            return null;
        }

        if (keyToFind in obj) {
            return obj[keyToFind];
        }

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const found = findKey(obj[key], keyToFind);
                if (found) {
                    return found;
                }
            }
        }
        return null;
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
    setSubmissionResponse(null);
    setIdFullOperation(null);
    setLeadId(null);
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
    switch (currentStep) {
      case 1:
        return <PersonalDetailsForm onSubmit={handleNext} initialData={formData} />;
      case 2:
        return <VehicleDetailsForm onSubmit={handleNext} onBack={handlePrev} initialData={formData} />;
      case 3:
        return <QuoteForm onSubmit={handleInitialSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleUpdate} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} initialData={{...formData, idFullOperation}} isSubmitting={isSubmitting} />;
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
