import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StatusBadge } from '../components/StatusBadge';
import * as api from '../lib/api';
import type { Lead } from '../lib/schemas';

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadLeads();
  }, [search, statusFilter, page]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const result = await api.getLeads({
        search,
        status: statusFilter,
        page,
        limit
      });
      setLeads(result.leads);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return 'Not specified';
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Leads</h1>
              <p className="text-muted-foreground">Manage your real estate leads</p>
            </div>
            <Link to="/leads/new">
              <Button size="lg" className="gap-2 btn-press transition-all-smooth hover:scale-105">
                <Plus className="h-4 w-4" />
                Add New Lead
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="shadow-[var(--shadow-card)] animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 transition-all-smooth focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="shadow-[var(--shadow-card)] animate-fade-in-up">
            <CardHeader>
              <CardTitle>All Leads ({total})</CardTitle>
              <CardDescription>Click on a lead to view details and activities</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No leads found</p>
                  <Link to="/leads/new">
                    <Button>Add your first lead</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Contact</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Budget</th>
                          <th className="text-left py-3 px-4 font-semibold">Source</th>
                          <th className="text-left py-3 px-4 font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="border-b hover:bg-muted/50 transition-all-smooth cursor-pointer hover:scale-[1.01]"
                            onClick={() => window.location.href = `/leads/${lead.id}`}
                          >
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                                <p className="text-sm text-muted-foreground">{lead.activity_count} activities</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-sm">{lead.email}</p>
                                <p className="text-sm text-muted-foreground">{lead.phone}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <StatusBadge status={lead.status} />
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm">{formatBudget(lead.budget_min, lead.budget_max)}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm capitalize">{lead.source}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Not specified'}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4 animate-stagger">
                    {leads.map((lead) => (
                      <Link key={lead.id} to={`/leads/${lead.id}`}>
                        <Card className="hover:shadow-[var(--shadow-elegant)] transition-all-smooth hover-lift">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold">{lead.first_name} {lead.last_name}</p>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                              </div>
                              <StatusBadge status={lead.status} />
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Phone:</span> {lead.phone}</p>
                              <p><span className="text-muted-foreground">Budget:</span> {formatBudget(lead.budget_min, lead.budget_max)}</p>
                              <p><span className="text-muted-foreground">Source:</span> {lead.source}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} leads
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Leads;
