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
      // Step 5 - No new data, just confirmation
  });
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);
  // State to store the ID of the created lead
  const [leadResult, setLeadResult] = useState<{leadResultId: string | null, idFullOperation: string | null}>({leadResultId: null, idFullOperation: null});
  const { toast } = useToast();

  const handleNext = (data: object) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    if (currentStep < TOTAL_STEPS + 1) { 
      setCurrentStep((prev) => prev + 1);
    }
  };
  
  // Step 3: Create Lead
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
        
        // Robustly find leadResultId and idFullOperation
        const leadId = response?.[0]?.leadResultId || response?.[0]?.result?.leadResultId;
        const fullOperationId = response?.[0]?.idFullOperation || response?.[0]?.result?.idFullOperation;

        if (leadId && fullOperationId) {
            setLeadResult({ leadResultId: leadId, idFullOperation: fullOperationId });
            setSubmissionResponse(response); // Store initial response
            toast({
                title: "Lead Creado Exitosamente (Paso 3)",
                description: `Su solicitud ha sido procesada. ID de Operación: ${fullOperationId}`,
            });
            handleNext(data); // Advance to step 4
        } else {
            console.error("Response from Salesforce:", response);
            throw new Error("No se pudo obtener el ID del Lead o el ID de Operación de Salesforce.");
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

  // Step 4: Update Lead with Contact Preferences
  const handleUpdateSubmit = async (data: object) => {
      setIsSubmitting(true);
      const updatedData = { ...formData, ...data };
      setFormData(updatedData);

      if (!leadResult.idFullOperation) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "No se ha encontrado el ID de Operación para actualizar. Por favor, vuelva a empezar.",
          });
          setIsSubmitting(false);
          return;
      }
      
      try {
          const token = await getSalesforceToken();
          const payload: any = {
              accessToken: token.access_token,
              instanceUrl: token.instance_url,
              idFullOperation: leadResult.idFullOperation,
              sourceEvent: updatedData.sourceEvent
          };

          // Add agent-specific data
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

          // For updates, a successful call might not return a detailed body.
          // If the API call doesn't throw an error, we can consider it a success.
          setSubmissionResponse(response); // Store update response
           toast({
              title: "Preferencia Guardada (Paso 4)",
              description: `Su preferencia de contacto ha sido guardada.`,
          });
          handleNext(data); // Advance to step 5
          
      } catch(e) {
          const errorMessage = e instanceof Error ? e.message : "Hubo un error al actualizar su información.";
          toast({
              variant: "destructive",
              title: "Fallo en la Actualización (Paso 4)",
              description: errorMessage,
          });
      } finally {
          setIsSubmitting(false);
      }
  }

  // Step 5: Final Update (Emission)
  const handleFinalSubmit = async (data: object) => {
      setIsSubmitting(true);
      const updatedData = { ...formData, ...data };
      setFormData(updatedData);
       if (!leadResult.idFullOperation) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "No se ha encontrado el ID de Operación para emitir. Por favor, vuelva a empezar.",
          });
          setIsSubmitting(false);
          return;
      }

      try {
          const token = await getSalesforceToken();
          const payload = {
              accessToken: token.access_token,
              instanceUrl: token.instance_url,
              idFullOperation: leadResult.idFullOperation,
              convertedStatus: '01' // Mark as won/emitted
          };

          const response = await updateLead(payload);
          setSubmissionResponse(response);
          toast({
              title: "Póliza Emitida Exitosamente (Paso 5)",
              description: `Su póliza ha sido emitida en Salesforce.`,
          });
          handleNext(data); // Advance to confirmation screen
          
      } catch(e) {
          const errorMessage = e instanceof Error ? e.message : "Hubo un error al emitir la póliza.";
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
    });
    setSubmissionResponse(null);
    setLeadResult({leadResultId: null, idFullOperation: null});
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
