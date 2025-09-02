'use server';

/**
 * @fileOverview A Genkit flow that intelligently suggests relevant form fields or options
 * based on the user's previous entries.
 *
 * - suggestFormField - A function that suggests form fields based on previous entries.
 * - SuggestFormFieldInput - The input type for the suggestFormField function.
 * - SuggestFormFieldOutput - The return type for the suggestFormField function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFormFieldInputSchema = z.object({
  formType: z
    .string()
    .describe('The type of the form the user is filling out (e.g., Personal Details, Contact Details, Demographic Information).'),
  previousEntries: z
    .record(z.string(), z.string())
    .describe('A record of the user\'s previous form entries, with field names as keys and their values as strings.'),
  currentField: z
    .string() // Make currentField optional so the flow can still be called when user hasn't started on a new field
    .optional()
    .describe('The name of the current form field the user is on.'),
  numberOfSuggestions: z
    .number()
    .min(1)
    .max(5)
    .default(3)
    .describe('The number of field suggestions to return.'),
});
export type SuggestFormFieldInput = z.infer<typeof SuggestFormFieldInputSchema>;

const SuggestFormFieldOutputSchema = z.object({
  suggestedFields: z
    .array(z.string())
    .describe('An array of suggested form field names based on the user\'s previous entries.'),
});
export type SuggestFormFieldOutput = z.infer<typeof SuggestFormFieldOutputSchema>;

export async function suggestFormField(input: SuggestFormFieldInput): Promise<SuggestFormFieldOutput> {
  return suggestFormFieldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFormFieldPrompt',
  input: {schema: SuggestFormFieldInputSchema},
  output: {schema: SuggestFormFieldOutputSchema},
  prompt: `You are an AI assistant helping users fill out forms more efficiently. Based on the type of form they are filling out, the previous entries they have made, and the current field they are on (if any), suggest relevant fields that the user might need to fill out next.

Form Type: {{{formType}}}
Previous Entries:
{{#each previousEntries}}
  {{@key}}: {{{this}}}
{{/each}}
Current Field: {{{currentField}}}

Please suggest {{{numberOfSuggestions}}} relevant form fields that the user might want to fill out next. Be specific in your suggestions. Return the result as a simple JSON array of strings.

For example:
{
  "suggestedFields": ["field1", "field2", "field3"]
}
`,
});

const suggestFormFieldFlow = ai.defineFlow(
  {
    name: 'suggestFormFieldFlow',
    inputSchema: SuggestFormFieldInputSchema,
    outputSchema: SuggestFormFieldOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
