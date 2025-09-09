'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentTypes, sexes, maritalStatuses, leadSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PersonalDetailsFormProps {
  onSubmit: (data: any) => void;
  initialData: any;
}

const PersonalDetailsForm = ({ onSubmit, initialData }: PersonalDetailsFormProps) => {
  const form = useForm({
    resolver: zodResolver(leadSchema.pick({ 
        firstName: true, 
        lastName: true, 
        company: true,
        documentType: true,
        documentNumber: true,
        birthdate: true,
        sex: true,
        maritalStatus: true,
        mobilePhone: true,
        phone: true,
        email: true,
        street: true,
        postalCode: true,
        city: true,
        district: true,
        municipality: true,
        state: true,
        country: true,
        colony: true,
    })),
    defaultValues: {
      ...initialData,
    },
    mode: 'onChange',
  });

  return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold mb-6">Información Personal y de la Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl><Input placeholder="E.g. John" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl><Input placeholder="E.g. Doe" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Compañía</FormLabel>
                            <FormControl><Input placeholder="E.g. MAPFRE Inc." {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Documento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {Object.entries(documentTypes).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="documentNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Número de Documento</FormLabel>
                            <FormControl><Input placeholder="E.g. 12345678X" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="birthdate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha de Nacimiento</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={'outline'}
                                        className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Seleccione una fecha</span>}
                                    </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown-buttons"
                                        fromYear={1900}
                                        toYear={new Date().getFullYear()}
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
                    <FormField
                        control={form.control}
                        name="sex"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Sexo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione sexo" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {Object.entries(sexes).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="maritalStatus"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estado Civil</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione estado civil" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {Object.entries(maritalStatuses).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <hr/>
            
             <div>
                <h2 className="text-xl font-semibold mb-6">Datos de Contacto</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <FormField
                        control={form.control}
                        name="mobilePhone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Teléfono Móvil</FormLabel>
                            <FormControl><Input placeholder="E.g. +123456789" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Teléfono Fijo</FormLabel>
                            <FormControl><Input placeholder="E.g. +987654321" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl><Input placeholder="E.g. john.doe@example.com" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Calle</FormLabel>
                            <FormControl><Input placeholder="E.g. 123 Main St" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl><Input placeholder="E.g. San Juan" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Código Postal</FormLabel>
                            <FormControl><Input placeholder="E.g. 12345" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="colony"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Colonia</FormLabel>
                            <FormControl><Input placeholder="E.g. Central Park" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="municipality"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Municipio</FormLabel>
                            <FormControl><Input placeholder="E.g. Test" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="district"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Distrito</FormLabel>
                            <FormControl><Input placeholder="E.g. Test" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <FormControl><Input placeholder="E.g. XX" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl><Input placeholder="E.g. XX" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            
            <div className="flex justify-end">
                <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold">
                    CONTINUAR >
                </Button>
            </div>
        </form>
      </FormProvider>
  );
};

export default PersonalDetailsForm;
