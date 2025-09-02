'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PersonalDetailsForm from '@/components/forms/personal-details-form';
import ContactDetailsForm from '@/components/forms/contact-details-form';
import DemographicInfoForm from '@/components/forms/demographic-info-form';
import SubmissionConfirmation from '@/components/forms/submission-confirmation';
import FormStepper from '@/components/form-stepper';
import Logo from '@/components/logo';
import { insertLead } from '@/ai/flows/insert-lead-flow';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const TOTAL_STEPS = 3;

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNext = async (data: object) => {
    setDirection(1);
    const updatedFormData = { ...formData, ...data };
    
    if (currentStep < TOTAL_STEPS) {
      setFormData(updatedFormData);
      setCurrentStep((prev) => prev + 1);
    } else {
       const finalData = { ...updatedFormData };
       if (finalData.dateOfBirth && finalData.dateOfBirth instanceof Date) {
        finalData.dateOfBirth = format(finalData.dateOfBirth, 'yyyy-MM-dd');
       }
       setFormData(finalData);
       setIsSubmitting(true);
      // Last step, submit to salesforce
      try {
        await insertLead(finalData);
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
        return <ContactDetailsForm onSubmit={handleNext} onBack={handlePrev} initialData={formData} />;
      case 3:
        return <DemographicInfoForm onSubmit={handleNext} onBack={handlePrev} initialData={formData} isSubmitting={isSubmitting} />;
      case 4:
        return <SubmissionConfirmation onStartOver={handleStartOver} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <header className="flex flex-col items-center justify-center mb-6 text-center">
          <Logo className="h-12 w-12 mb-2 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-primary">CoverMe Forms</h1>
          <p className="text-muted-foreground mt-1">A smarter way to fill out forms.</p>
        </header>

        {currentStep <= TOTAL_STEPS && (
            <div className="mb-8">
                <FormStepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
            </div>
        )}

        <main className="relative h-[550px] sm:h-[500px] overflow-hidden">
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
  );
}
