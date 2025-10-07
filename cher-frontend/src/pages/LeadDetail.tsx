import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Phone, Mail, DollarSign, Calendar, Plus } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { useForm } from 'react-hook-form';
import * as api from '../lib/api';
import type { Lead, Activity } from '../lib/schemas';

interface ActivityForm {
  activity_type: 'call' | 'email' | 'meeting' | 'note';
  title: string;
  notes?: string;
  duration?: number;
  activity_date: string;
}

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ActivityForm>({
    defaultValues: {
      activity_type: 'note',
      activity_date: new Date().toISOString().split('T')[0]
    }
  });

  const activityType = watch('activity_type');

  useEffect(() => {
    loadLead();
    loadActivities();
  }, [id]);

  const loadLead = async () => {
    try {
      const data = await api.getLead(Number(id));
      setLead(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load lead',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await api.getLeadActivities(Number(id));
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteLead(Number(id));
      toast({
        title: 'Lead deleted',
        description: 'The lead has been successfully deleted'
      });
      navigate('/leads');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive'
      });
    }
  };

  const onSubmitActivity = async (data: ActivityForm) => {
    setIsSubmitting(true);
    try {
      await api.createActivity(Number(id), data);
      toast({
        title: 'Activity added',
        description: 'The activity has been successfully added'
      });
      reset();
      setIsDialogOpen(false);
      loadActivities();
      loadLead();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add activity',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading lead...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Lead not found</p>
            <Link to="/leads">
              <Button>Back to Leads</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/leads">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold">{lead.first_name} {lead.last_name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={lead.status} />
                  <span className="text-sm text-muted-foreground capitalize">{lead.source} lead</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/leads/${id}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this lead. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 animate-stagger">
            {/* Lead Info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget Range</p>
                      <p className="font-medium">
                        {lead.budget_min && lead.budget_max 
                          ? `$${(lead.budget_min / 1000).toFixed(0)}k - $${(lead.budget_max / 1000).toFixed(0)}k`
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  {lead.property_interest && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Interest</p>
                      <p className="font-medium">{lead.property_interest}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-2">
              <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Activity Timeline</CardTitle>
                      <CardDescription>{activities.length} activities recorded</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2 btn-press transition-all-smooth">
                          <Plus className="h-4 w-4" />
                          Add Activity
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleSubmit(onSubmitActivity)}>
                          <DialogHeader>
                            <DialogTitle>Add New Activity</DialogTitle>
                            <DialogDescription>Record a new interaction with this lead</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="activity_type">Activity Type</Label>
                              <Select
                                defaultValue="note"
                                onValueChange={(value) => {
                                  register('activity_type').onChange({ target: { value } });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="call">Call</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="meeting">Meeting</SelectItem>
                                  <SelectItem value="note">Note</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="title">Title</Label>
                              <Input
                                id="title"
                                {...register('title', { required: 'Title is required' })}
                                placeholder="e.g., Follow-up call"
                              />
                              {errors.title && (
                                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="notes">Notes</Label>
                              <Textarea
                                id="notes"
                                {...register('notes')}
                                placeholder="Add any additional details..."
                                rows={3}
                              />
                            </div>
                            {activityType === 'call' && (
                              <div>
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                  id="duration"
                                  type="number"
                                  {...register('duration', { valueAsNumber: true })}
                                  placeholder="30"
                                />
                              </div>
                            )}
                            <div>
                              <Label htmlFor="activity_date">Date</Label>
                              <Input
                                id="activity_date"
                                type="date"
                                {...register('activity_date', { required: 'Date is required' })}
                              />
                              {errors.activity_date && (
                                <p className="text-sm text-destructive mt-1">{errors.activity_date.message}</p>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? 'Adding...' : 'Add Activity'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No activities yet</p>
                      <p className="text-sm text-muted-foreground">Add your first activity to start tracking interactions</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-stagger">
                      {activities.map((activity, index) => (
                        <div key={activity.id} className="relative pl-8 pb-4 last:pb-0">
                          {index !== activities.length - 1 && (
                            <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
                          )}
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary-foreground uppercase">
                              {activity.activity_type.substring(0, 1)}
                            </span>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted transition-all-smooth">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold">{activity.title}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {activity.activity_type}
                                  {activity.duration && ` • ${activity.duration} minutes`}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(activity.activity_date).toLocaleDateString()}
                              </p>
                            </div>
                            {activity.notes && (
                              <p className="text-sm mt-2">{activity.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              By {activity.user_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeadDetail;
