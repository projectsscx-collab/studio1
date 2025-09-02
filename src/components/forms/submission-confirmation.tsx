'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SubmissionConfirmationProps {
  onStartOver: () => void;
}

const SubmissionConfirmation = ({ onStartOver }: SubmissionConfirmationProps) => {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="p-3 rounded-full bg-accent mb-4">
            <CheckCircle2 className="h-10 w-10 text-accent-foreground" />
        </div>
        <CardTitle className="text-2xl">Submission Successful!</CardTitle>
        <CardDescription>
          Thank you for completing the form. Your information has been received.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-center text-muted-foreground">
          You will receive a confirmation email shortly. If you have any questions, please don't hesitate to contact our support team.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={onStartOver}>Start a New Form</Button>
      </CardFooter>
    </Card>
  );
};

export default SubmissionConfirmation;
