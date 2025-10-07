import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as api from '../lib/api';
import type { DashboardStats } from '../lib/schemas';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(263, 70%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(26, 90%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

const Analytics = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Insights into your lead performance and conversion</p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-3 animate-stagger">
            <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
              <CardHeader>
                <CardTitle className="text-lg">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats?.total_leads || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
              <CardHeader>
                <CardTitle className="text-lg">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats?.conversion_rate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
              <CardHeader>
                <CardTitle className="text-lg">Closed Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats?.closed_leads || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2 animate-stagger">
            {/* Leads by Status */}
            <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
              <CardHeader>
                <CardTitle>Leads by Status</CardTitle>
                <CardDescription>Distribution of leads across different stages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats ? Object.entries(stats.leads_by_status || {}).map(([name, value]) => ({ name, value })) : []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leads by Source */}
            <Card className="shadow-[var(--shadow-card)] hover-lift transition-all-smooth">
              <CardHeader>
                <CardTitle>Leads by Source</CardTitle>
                <CardDescription>Where your leads are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats ? Object.entries(stats.leads_by_source || {}).map(([name, value]) => ({ name, value })) : []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(stats ? Object.entries(stats.leads_by_source || {}).map(([name, value]) => ({ name, value })) : []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className="shadow-[var(--shadow-card)] animate-fade-in-up hover-lift transition-all-smooth">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key metrics overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-stagger">
                <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--status-new))]/10 to-[hsl(var(--status-new))]/5 border border-[hsl(var(--status-new))]/20 hover:scale-105 transition-transform duration-300">
                  <p className="text-sm text-muted-foreground mb-1">New Leads</p>
                  <p className="text-2xl font-bold">{stats?.new_leads || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--status-contacted))]/10 to-[hsl(var(--status-contacted))]/5 border border-[hsl(var(--status-contacted))]/20 hover:scale-105 transition-transform duration-300">
                  <p className="text-sm text-muted-foreground mb-1">Contacted</p>
                  <p className="text-2xl font-bold">{stats?.contacted_leads || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--status-qualified))]/10 to-[hsl(var(--status-qualified))]/5 border border-[hsl(var(--status-qualified))]/20 hover:scale-105 transition-transform duration-300">
                  <p className="text-sm text-muted-foreground mb-1">Qualified</p>
                  <p className="text-2xl font-bold">{stats?.qualified_leads || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-[hsl(var(--status-closed))]/10 to-[hsl(var(--status-closed))]/5 border border-[hsl(var(--status-closed))]/20 hover:scale-105 transition-transform duration-300">
                  <p className="text-sm text-muted-foreground mb-1">Closed</p>
                  <p className="text-2xl font-bold">{stats?.closed_leads || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;