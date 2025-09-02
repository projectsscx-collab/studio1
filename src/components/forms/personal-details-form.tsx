'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalDetailsSchema, type PersonalDetailsData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ContactDetailsForm from './contact-details-form';
import VehicleUsageForm from './vehicle-usage-form';

interface PersonalDetailsFormProps {
  onSubmit: (data: any) => void;
  initialData: Partial<PersonalDetailsData>;
}

const towns = ["GUAYANILLA - 00656", "ADJUNTAS - 00601", "AGUADA - 00602", "AGUADILLA - 00603"];
const maritalStatuses = ["SOLTERO/A", "CASADO/A", "DIVORCIADO/A", "VIUDO/A"];

const PersonalDetailsForm = ({ onSubmit, initialData }: PersonalDetailsFormProps) => {
  const form = useForm<PersonalDetailsData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      town: '',
      email: '',
      confirmEmail: '',
      phone: '',
      isPrincipalDriver: '',
      hasInsuranceAgent: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-6">Bríndanos tu información</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>¿Cuál es tu primer nombre? <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><Input placeholder="Nestor Maximo" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>¿Cuáles son tus apellidos? <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><Input placeholder="Aceves Huelamo" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Género <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="MASCULINO" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">MASCULINO</SelectItem>
                                            <SelectItem value="female">FEMENINO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="town"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>¿En qué pueblo vives? <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="GUAYANILLA - 00656" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {towns.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="maritalStatus"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>¿Cuál es tu estado civil? <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="SOLTERO/A" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                             {maritalStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>¿Cuál es tu fecha de nacimiento? <span className="text-red-500">*</span></FormLabel>
                                        <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                            <Button
                                                variant={'outline'}
                                                className={cn('w-[240px] justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>09/06/2005</span>}
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value) : undefined}
                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                            initialFocus
                                            />
                                        </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <hr/>
                
                <ContactDetailsForm />

                <hr/>

                <VehicleUsageForm />

            </div>
          
            <div className="flex justify-end mt-12">
              <Button type="submit" size="lg" className="bg-lime-500 hover:bg-lime-600 text-black font-bold">
                CONTINUAR &gt;
              </Button>
            </div>
        </form>
      </FormProvider>
  );
};

export default PersonalDetailsForm;
