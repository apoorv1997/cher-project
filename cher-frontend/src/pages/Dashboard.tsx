import { useEffect, useState, type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, CheckCircle, Phone, ArrowRight } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import * as api from '../lib/api';
import type { DashboardStats } from '../lib/schemas';
import { StatusBadge } from '../components/StatusBadge';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
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
            <p className="text-muted-foreground">Loading dashboard...</p>
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
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your lead overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-stagger">
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all-smooth hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_leads || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all-smooth hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-[hsl(var(--status-new))]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.new_leads || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting contact</p>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all-smooth hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                <Phone className="h-4 w-4 text-[hsl(var(--status-contacted))]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.contacted_leads || 0}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all-smooth hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Closed</CardTitle>
                <CheckCircle className="h-4 w-4 text-[hsl(var(--status-closed))]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.closed_leads || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.conversion_rate.toFixed(1)}% conversion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="shadow-[var(--shadow-card)] animate-fade-in-up">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest interactions with your leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recent_activities.map((activity: { id: Key | null | undefined; activity_type: string; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; notes: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; user_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; activity_date: string | number | Date; }) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-all-smooth hover-lift"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary uppercase">
                        {activity.activity_type.substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.notes}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.user_name} • {new Date(activity.activity_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-[var(--shadow-card)] bg-gradient-to-br from-primary/10 to-accent/10 border-none animate-fade-in-up hover-lift transition-all-smooth">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Ready to manage your leads?</h3>
                  <p className="text-sm text-muted-foreground">View all leads and add new ones</p>
                </div>
                <Link to="/leads">
                  <Button size="lg" className="gap-2 btn-press transition-all-smooth">
                    Go to Leads <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
