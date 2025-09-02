'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import PersonalDetailsForm from '@/components/forms/personal-details-form';
import VehicleDetailsForm from '@/components/forms/vehicle-details-form';
import QuoteForm from '@/components/forms/quote-form';
import SubmissionConfirmation from '@/components/forms/submission-confirmation';
import FormStepper from '@/components/form-stepper';
import { insertLead } from '@/ai/flows/insert-lead-flow';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';

const TOTAL_STEPS = 3;

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNext = async (data: object) => {
    setDirection(1);
    
    // Format dateOfBirth if it exists in the current step's data
    const formattedData = { ...data };
    if ('birthdate' in formattedData && formattedData.birthdate instanceof Date) {
        (formattedData as any).birthdate = format(formattedData.birthdate, 'yyyy-MM-dd');
    }

    const updatedFormData = { ...formData, ...formattedData };
    setFormData(updatedFormData);
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
       setIsSubmitting(true);
      try {
        await insertLead(updatedFormData);
        setCurrentStep(prev => prev + 1);
      } catch (e) {
        console.error("Failed to insert lead", e);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was an error submitting your form. Please try again."
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  };
  
  const handleStartOver = () => {
    setDirection(1);
    setFormData({});
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
        return <QuoteForm onSubmit={handleNext} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting}/>;
      case 4:
        return <SubmissionConfirmation onStartOver={handleStartOver} />;
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

            <main className="relative h-[650px] overflow-hidden">
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
