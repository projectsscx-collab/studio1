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
  const [leadId, setLeadId] = useState<string | null>(null);
  const [idFullOperation, setIdFullOperation] = useState<string | null>(null);
  const { toast } = useToast();

  const handleNext = (data: object) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    if (currentStep < TOTAL_STEPS + 1) { 
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleQuoteSubmit = async (data: object) => {
    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
        const token = await getSalesforceToken();
        const payload = { 
            ...updatedData,
            accessToken: token.access_token,
            instanceUrl: token.instance_url
        };
        
        const response = await insertLead(payload);
        
        if (response[0]?.leadResultId) {
            setLeadId(response[0].leadResultId);
            setIdFullOperation(response[0].idFullOperation); // Store idFullOperation
            toast({
                title: "Lead Creado Exitosamente",
                description: `Su lead con ID: ${response[0].leadResultId} ha sido creado.`,
            });
            handleNext(data);
        } else {
            const errorMessage = response[0]?.resultErrors[0]?.errorMessage || "Hubo un error al crear el lead.";
            throw new Error(errorMessage);
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Hubo un error al enviar su formulario. Por favor, inténtelo de nuevo.";
        toast({
            variant: "destructive",
            title: "Fallo en el Envío (Paso 3)",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleUpdateSubmit = async (data: object) => {
    if (!leadId) {
        toast({ variant: "destructive", title: "Error", description: "No se ha encontrado el ID del lead para actualizar." });
        return;
    }
    setIsSubmitting(true);
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    try {
        const token = await getSalesforceToken();
        const payload = { 
            ...updatedData,
            leadId,
            idFullOperation, // Pass idFullOperation
            accessToken: token.access_token,
            instanceUrl: token.instance_url
        };

        const response = await updateLead(payload);

        if (response[0]?.isSuccess) {
            toast({
                title: "Lead Actualizado Exitosamente",
                description: `El lead ha sido actualizado con sus preferencias.`,
            });
            handleNext(data);
        } else {
             const errorMessage = response[0]?.resultErrors[0]?.errorMessage || "Hubo un error desconocido durante la actualización.";
             throw new Error(errorMessage);
        }

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Hubo un error al actualizar. Por favor, inténtelo de nuevo.";
        toast({
            variant: "destructive",
            title: "Fallo en la Actualización (Paso 4)",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (data: object) => {
    if (!leadId) {
        toast({ variant: "destructive", title: "Error", description: "No se ha encontrado el ID del lead para finalizar." });
        return;
    }
    setIsSubmitting(true);
    const finalData = { ...formData, ...data, convertedStatus: '01' };
    setFormData(finalData);

    try {
        const token = await getSalesforceToken();
        const payload = { 
            ...finalData,
            leadId,
            idFullOperation, // Pass idFullOperation
            accessToken: token.access_token,
            instanceUrl: token.instance_url,
        };
        
        const response = await updateLead(payload);

        if (response[0]?.isSuccess) {
            setSubmissionResponse(response);
             toast({
                title: "Lead Convertido Exitosamente",
                description: `Su lead con ID: ${leadId} ha sido procesado y convertido.`,
            });
            handleNext(finalData);
        } else {
            const errorMessage = response[0]?.resultErrors[0]?.errorMessage || "Hubo un error desconocido durante la conversión.";
            throw new Error(errorMessage);
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Hubo un error al emitir su póliza. Por favor, inténtelo de nuevo.";
        toast({
            variant: "destructive",
            title: "Fallo en la Emisión (Paso 5)",
            description: errorMessage,
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
    setLeadId(null);
    setIdFullOperation(null);
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
        return <QuoteForm onSubmit={handleQuoteSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 4:
        return <ContactPreferenceForm onSubmit={handleUpdateSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 5:
        return <EmissionForm onSubmit={handleFinalSubmit} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
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
