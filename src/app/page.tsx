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
import { insertLead, getSalesforceToken, SalesforceTokenResponse, updateLead, UpdateLeadInput } from '@/ai/flows/insert-lead-flow';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 5;

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
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
      // Step 5
      convertedStatus: '',
  });
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  const [tokenResponse, setTokenResponse] = useState<SalesforceTokenResponse | null>(null);
  const [lastUpdateResponse, setLastUpdateResponse] = useState<any>(null);
  const { toast } = useToast();

  const handleNext = (data: object) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    if (currentStep <= TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  
  const handleLeadInsert = async (data: object) => {
    if (!tokenResponse) {
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "El token de Salesforce no está disponible. Por favor, autentíquese primero."
        });
        return;
    }
    
    setIsSubmitting(true);
    const finalData = { ...formData, ...data };
    setFormData(finalData);

    try {
        const payload = { 
            ...finalData,
            accessToken: tokenResponse.access_token,
            instanceUrl: tokenResponse.instance_url
        };
        const response = await insertLead(payload);
        setSubmissionResponse(response);
        
        const leadId = response[0]?.leadResultId;
        if (leadId) {
            setFormData(prev => ({...prev, leadResultId: leadId}));
             toast({
                title: "Lead Creado Exitosamente",
                description: `El lead con ID: ${leadId} ha sido creado.`,
            });
        } else {
           const errorMessage = response[0]?.resultErrors[0]?.errorMessage || "Hubo un error desconocido.";
            throw new Error(errorMessage);
        }

        handleNext(data);
    } catch (e) {
        console.error("Failed to insert lead", e);
        const errorMessage = e instanceof Error ? e.message : "Hubo un error al enviar su formulario. Por favor, inténtelo de nuevo.";
        toast({
            variant: "destructive",
            title: "Fallo en el Envío",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleLeadUpdate = async (data: object) => {
     if (!tokenResponse || !submissionResponse) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "El token de autenticación o el ID del Lead no están disponibles."
        });
        return;
    }
    
    setIsSubmitting(true);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);

    try {
        const leadId = submissionResponse[0]?.leadResultId;
        if (!leadId) {
            throw new Error("No se pudo encontrar el leadResultId en la respuesta de envío.");
        }
        
        const payload: UpdateLeadInput = { 
            accessToken: tokenResponse.access_token,
            instanceUrl: tokenResponse.instance_url,
            leadId: leadId,
            ...updatedFormData,
        };
        
        if (data.hasOwnProperty('agentType')) {
            payload.sourceEvent = updatedFormData.sourceEvent;
            payload.agentType = updatedFormData.agentType;
        }

        if (data.hasOwnProperty('convertedStatus')) {
            payload.convertedStatus = updatedFormData.convertedStatus;
        }

        const response = await updateLead(payload);
        setLastUpdateResponse(response);
        
        if (response[0]?.leadResultId) {
             toast({
                title: "Lead Actualizado Exitosamente",
                description: `El lead con ID: ${leadId} ha sido actualizado.`,
            });
        } else {
            const errorMessage = response[0]?.resultErrors[0]?.errorMessage || "Hubo un error desconocido al actualizar.";
            throw new Error(errorMessage);
        }
       
        handleNext(data);
    } catch (e) {
        console.error("Failed to update lead", e);
        const errorMessage = e instanceof Error ? e.message : "Hubo un error al actualizar su formulario. Por favor, inténtelo de nuevo.";
        toast({
            variant: "destructive",
            title: "Fallo en la Actualización",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  }


  const handleGetToken = async () => {
    setIsSubmitting(true);
    setTokenResponse(null);
    try {
        const token = await getSalesforceToken();
        setTokenResponse(token);
        toast({
            title: "Autenticación Exitosa",
            description: "Token de Salesforce obtenido correctamente.",
        });
    } catch (e) {
         console.error("Failed to get token", e);
        toast({
            variant: "destructive",
            title: "Fallo de Autenticación",
            description: "No se pudo obtener el token de autenticación de Salesforce."
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handlePrev = () => {
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  };
  
  const handleStartOver = () => {
    setDirection(1);
    setFormData({
      firstName: '',
      lastName: '',
      documentType: '',
      documentNumber: '',
      birthdate: '',
      mobilePhone: '',
      phone: '',
      email: '',
      numero_de_matricula: '',
      marca: '',
      modelo: '',
      ano_del_vehiculo: '',
      numero_de_serie: '',
      effectiveDate: '',
      expirationDate: '',
      paymentMethod: '',
      paymentPeriodicity: '',
      paymentTerm: '',
      sourceEvent: '',
      agentType: '',
      convertedStatus: '',
    });
    setSubmissionResponse(null);
    setTokenResponse(null);
    setLastUpdateResponse(null);
    setCurrentStep(1);
  }

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
        return <QuoteForm onGetToken={handleGetToken} onSubmit={handleLeadInsert} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} tokenResponse={tokenResponse}/>;
      case 4:
        return <ContactPreferenceForm onSubmit={handleLeadUpdate} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} response={lastUpdateResponse}/>;
      case 5:
        return <EmissionForm onSubmit={handleLeadUpdate} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} response={lastUpdateResponse}/>;
      case 6:
        return <SubmissionConfirmation onStartOver={handleStartOver} response={lastUpdateResponse || submissionResponse} />;
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
              <FormStepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
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
