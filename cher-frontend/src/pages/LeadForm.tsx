import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import * as api from '../lib/api';
import type { Lead } from '../lib/schemas';

interface LeadFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'closed' | 'lost';
  source: 'website' | 'referral' | 'zillow' | 'other';
  budget_min?: number;
  budget_max?: number;
  property_interest?: string;
}

const LeadForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const isEdit = id && id !== 'new';

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LeadFormData>({
    defaultValues: {
      status: 'new',
      source: 'website'
    }
  });

  useEffect(() => {
    if (isEdit) {
      loadLead();
    }
  }, [id]);

  const loadLead = async () => {
    try {
      const data = await api.getLead(Number(id));
      setLead(data);
      // Set form values
      Object.keys(data).forEach((key) => {
        setValue(key as keyof LeadFormData, data[key as keyof Lead] as any);
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load lead',
        variant: 'destructive'
      });
      navigate('/leads');
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsLoading(true);
    try {
      if (isEdit) {
        await api.updateLead(Number(id), data);
        toast({
          title: 'Lead updated',
          description: 'The lead has been successfully updated'
        });
      } else {
        await api.createLead(data);
        toast({
          title: 'Lead created',
          description: 'The lead has been successfully created'
        });
      }
      navigate('/leads');
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} lead`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6 max-w-3xl mx-auto animate-in">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/leads">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">{isEdit ? 'Edit Lead' : 'Add New Lead'}</h1>
              <p className="text-muted-foreground">
                {isEdit ? 'Update lead information' : 'Create a new lead in your CRM'}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-[var(--shadow-card)] animate-fade-in-up hover-lift transition-all-smooth">
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <CardDescription>Enter the lead's contact and property details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        {...register('first_name', { required: 'First name is required' })}
                        placeholder="John"
                      />
                      {errors.first_name && (
                        <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        {...register('last_name', { required: 'Last name is required' })}
                        placeholder="Smith"
                      />
                      {errors.last_name && (
                        <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        {...register('phone', { required: 'Phone is required' })}
                        placeholder="+1-555-0100"
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lead Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lead Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        defaultValue="new"
                        onValueChange={(value) => setValue('status', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Select
                        defaultValue="website"
                        onValueChange={(value) => setValue('source', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="zillow">Zillow</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Property Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget_min">Minimum Budget</Label>
                      <Input
                        id="budget_min"
                        type="number"
                        {...register('budget_min', { valueAsNumber: true })}
                        placeholder="300000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget_max">Maximum Budget</Label>
                      <Input
                        id="budget_max"
                        type="number"
                        {...register('budget_max', { valueAsNumber: true })}
                        placeholder="450000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="property_interest">Property Interest</Label>
                    <Textarea
                      id="property_interest"
                      {...register('property_interest')}
                      placeholder="e.g., 3BR house in suburban area"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 btn-press transition-all-smooth">
                    {isLoading ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
                  </Button>
                  <Link to="/leads" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LeadForm;
