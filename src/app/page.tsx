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
  // Step 4 - Contact Preferences
  sourceEvent: string;
  agentType: string;
}

interface LeadResult {
  leadResultId: string | null;
}

interface SalesforceResponse {
  leadResultId?: string;
  result?: {
    leadResultId?: string;
  };
}

const TOTAL_STEPS = 5; // Pasos del formulario (sin contar la confirmación)
const TOTAL_SCREENS = 6; // Total de pantallas incluyendo confirmación

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
};

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  const [leadResult, setLeadResult] = useState<LeadResult>({
    leadResultId: null,
  });
  const { toast } = useToast();

  const extractLeadId = (response: any): string | null => {
    if (!response || !Array.isArray(response) || response.length === 0) {
      return null;
    }
    const result = response[0];
    if (result && result.resultErrors && result.resultErrors.length > 0) {
      return null;
    }
    return result?.leadResultId || null;
  };
  
  const canProceedToNextStep = (step: number): boolean => {
    switch (step) {
      case 4:
      case 5:
        return !!leadResult.leadResultId;
      default:
        return true;
    }
  };

  const handleNext = (data: Partial<FormData>) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    
    if (currentStep < TOTAL_SCREENS) { 
      setCurrentStep((prev) => prev + 1);
    }
  };
  
  const handleQuoteSubmit = async (data: Partial<FormData>) => {
    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      const token = await getSalesforceToken();
      
      if (!token?.access_token || !token?.instance_url) {
        throw new Error("No se pudo obtener el token de Salesforce");
      }

      const payload = { 
        ...updatedData,
        accessToken: token.access_token,
        instanceUrl: token.instance_url
      };
      
      const response = await insertLead(payload);
      
      const leadId = extractLeadId(response);
      setSubmissionResponse(response);
      
      if (leadId) {
        setLeadResult({ 
          leadResultId: leadId, 
        });
        
        toast({
          title: "Paso 3 Exitoso",
          description: "Lead creado correctamente en Salesforce.",
        });
        
        handleNext(data); 
      } else {
         const errorMessages = response?.[0]?.resultErrors?.map((e: any) => e.errorMessage).join(', ') || "La respuesta de Salesforce no contiene el ID de Lead necesario.";
         console.error("Salesforce response did not contain expected IDs:", response);
         throw new Error(errorMessages);
      }
      
    } catch (error) {
      console.error("Error in handleQuoteSubmit:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Hubo un error al enviar su formulario. Por favor, inténtelo de nuevo.";
      
      toast({
        variant: "destructive",
        title: "Fallo en el Envío (Paso 3)",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (data: Partial<FormData>) => {
    if (!canProceedToNextStep(4)) {
      toast({
        variant: "destructive",
        title: "Error Crítico",
        description: "No se ha encontrado el ID del Lead para actualizar. Por favor, vuelva a empezar.",
      });
      return;
    }

    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);
      
    try {
      const token = await getSalesforceToken();
      
      if (!token?.access_token || !token?.instance_url) {
        throw new Error("No se pudo obtener el token de Salesforce");
      }

      const payload: any = {
        ...updatedData, // Pass all form data
        accessToken: token.access_token,
        instanceUrl: token.instance_url,
        leadResultId: leadResult.leadResultId,
      };

      if (updatedData.agentType === 'APM') {
        payload.systemOrigin = '02';
        payload.origin = '02';
        payload.utmCampaign = 'ROPO_APMCampaign';
        payload.leadSource = '02';
      } else if (updatedData.agentType === 'ADM') {
        payload.systemOrigin = '06';
        payload.origin = '02';
        payload.utmCampaign = 'ROPO_ADMCampaign';
        payload.leadSource = '10';
      }
      
      const response = await updateLead(payload);
      setSubmissionResponse(response);
      
      toast({
        title: "Paso 4 Exitoso",
        description: "Su preferencia de contacto ha sido guardada.",
      });
      
      handleNext(data);
          
    } catch (error) {
      console.error("Error in handleUpdateSubmit:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Hubo un error al actualizar su información.";
      
      toast({
        variant: "destructive",
        title: "Fallo en la Actualización (Paso 4)",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (data: Partial<FormData>) => {
    if (!canProceedToNextStep(5)) {
      toast({
        variant: "destructive",
        title: "Error Crítico",
        description: "No se ha encontrado el ID del Lead para emitir. Por favor, vuelva a empezar.",
      });
      return;
    }

    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
      const token = await getSalesforceToken();
      
      if (!token?.access_token || !token?.instance_url) {
        throw new Error("No se pudo obtener el token de Salesforce");
      }

      const payload: any = {
        ...updatedData, // Pass all form data
        accessToken: token.access_token,
        instanceUrl: token.instance_url,
        leadResultId: leadResult.leadResultId,
        convertedStatus: '01' // New data for this step
      };

      const response = await updateLead(payload);
      setSubmissionResponse(response);
      
      toast({
        title: "Paso 5 Exitoso",
        description: "Su póliza ha sido emitida en Salesforce.",
      });
      
      handleNext(data);
          
    } catch (error) {
      console.error("Error in handleFinalSubmit:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Hubo un error al emitir la póliza.";
      
      toast({
        variant: "destructive",
        title: "Fallo en la Emisión (Paso 5)",
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
    setSubmissionResponse(null);
    setLeadResult({ leadResultId: null });
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
        return (
          <PersonalDetailsForm 
            onSubmit={handleNext} 
            initialData={formData} 
          />
        );
      case 2:
        return (
          <VehicleDetailsForm 
            onSubmit={handleNext} 
            onBack={handlePrev} 
            initialData={formData} 
          />
        );
      case 3:
        return (
          <QuoteForm 
            onSubmit={handleQuoteSubmit} 
            onBack={handlePrev} 
            initialData={formData} 
            isSubmitting={isSubmitting} 
          />
        );
      case 4:
        return (
          <ContactPreferenceForm 
            onSubmit={handleUpdateSubmit} 
            onBack={handlePrev} 
            initialData={formData} 
            isSubmitting={isSubmitting} 
          />
        );
      case 5:
        return (
          <EmissionForm 
            onSubmit={handleFinalSubmit} 
            onBack={handlePrev} 
            initialData={formData} 
            isSubmitting={isSubmitting} 
          />
        );
      case 6:
        return (
          <SubmissionConfirmation 
            onStartOver={handleStartOver} 
            response={submissionResponse} 
          />
        );
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
