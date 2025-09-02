'use client';

import { useState } from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { suggestFormField } from '@/ai/flows/intelligent-field-suggestion';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface AiAssistantProps {
  formType: 'Personal Details' | 'Contact Details' | 'Demographic Information';
  currentFields: Record<string, string>;
  fieldNames: string[];
}

const AiAssistant = ({ formType, currentFields, fieldNames }: AiAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { setFocus } = useFormContext();
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const response = await suggestFormField({
        formType,
        previousEntries: currentFields,
        numberOfSuggestions: 3,
      });
      // Filter suggestions to only include fields present in the current form
      const validSuggestions = response.suggestedFields.filter(field => fieldNames.includes(field));
      setSuggestions(validSuggestions);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch AI suggestions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (fieldName: string) => {
    try {
      setFocus(fieldName);
    } catch(e) {
      console.warn(`Could not set focus to field: ${fieldName}`, e);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleGetSuggestions}>
          <Sparkles className="mr-2 h-4 w-4" />
          AI Assistant
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Field Suggestions</h4>
            <p className="text-sm text-muted-foreground">
              Based on your input, here are some fields you might want to fill next.
            </p>
          </div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Generating suggestions...</div>
          ) : suggestions.length > 0 ? (
            <ul className="grid gap-2">
              {suggestions.map((field) => (
                <li key={field}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleSuggestionClick(field)}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No suggestions available.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AiAssistant;
