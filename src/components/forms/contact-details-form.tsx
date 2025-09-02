'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactDetailsSchema, type ContactDetailsData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AiAssistant from '@/components/ai-assistant';

interface ContactDetailsFormProps {
  onSubmit: (data: ContactDetailsData) => void;
  onBack: () => void;
  initialData: Partial<ContactDetailsData>;
}

const countries = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "India", "Brazil"];

const ContactDetailsForm = ({ onSubmit, onBack, initialData }: ContactDetailsFormProps) => {
  const form = useForm<ContactDetailsData>({
    resolver: zodResolver(contactDetailsSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: '',
      email: '',
      ...initialData,
    },
    mode: 'onChange',
  });
  const { watch } = form;

  const currentValues = watch();
  const fieldNames = Object.keys(contactDetailsSchema.shape);

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
              <CardDescription>Let us know how to reach you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Anytown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP / Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack}>Back</Button>
               <AiAssistant
                formType="Contact Details"
                currentFields={Object.fromEntries(Object.entries(currentValues).filter(([_, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))}
                fieldNames={fieldNames}
              />
              <Button type="submit">Next</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
  );
};

export default ContactDetailsForm;
