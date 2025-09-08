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
import { insertLead, getSalesforceToken, SalesforceTokenResponse } from '@/ai/flows/insert-lead-flow';
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
      convertedStatus: '01', // Pre-set for the final step
  });
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  const [tokenResponse, setTokenResponse] = useState<SalesforceTokenResponse | null>(null);
  const { toast } = useToast();

  const handleNext = (data: object) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    if (currentStep < TOTAL_STEPS + 1) { // Allow moving to confirmation screen
      setCurrentStep((prev) => prev + 1);
    }
  };
  
  const handleFinalSubmit = async (data: object) => {
    if (!tokenResponse) {
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "El token de Salesforce no está disponible. Por favor, inténtelo de nuevo."
        });
        setIsSubmitting(false);
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
             toast({
                title: "Lead Creado y Convertido Exitosamente",
                description: `El lead con ID: ${leadId} ha sido procesado.`,
            });
             handleNext(data); // Move to confirmation screen
        } else {
           const errorMessage = response[0]?.resultErrors[0]?.errorMessage || "Hubo un error desconocido durante el envío.";
            throw new Error(errorMessage);
        }

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

  const handleGetTokenAndSubmit = async (data: object) => {
    setIsSubmitting(true);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);

    try {
        const token = await getSalesforceToken();
        setTokenResponse(token);
        // Now that we have the token, call the final submit function
        await handleFinalSubmit({ ...updatedFormData, accessToken: token.access_token, instanceUrl: token.instance_url });
    } catch (e) {
        console.error("Failed to get token", e);
        toast({
            variant: "destructive",
            title: "Fallo de Autenticación",
            description: "No se pudo obtener el token de autenticación de Salesforce."
        });
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
      convertedStatus: '01',
    });
    setSubmissionResponse(null);
    setTokenResponse(null);
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
        return <QuoteForm onSubmit={handleNext} onBack={handlePrev} initialData={formData} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleNext} onBack={handlePrev} initialData={formData} />;
      case 5:
        return <EmissionForm onSubmit={handleGetTokenAndSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
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
