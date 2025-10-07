import { Badge } from '../components/ui/badge';

interface StatusBadgeProps {
  status: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'closed' | 'lost';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    new: { label: 'New', className: 'bg-[hsl(var(--status-new))] text-white hover:bg-[hsl(var(--status-new))]' },
    contacted: { label: 'Contacted', className: 'bg-[hsl(var(--status-contacted))] text-white hover:bg-[hsl(var(--status-contacted))]' },
    qualified: { label: 'Qualified', className: 'bg-[hsl(var(--status-qualified))] text-white hover:bg-[hsl(var(--status-qualified))]' },
    negotiation: { label: 'Negotiation', className: 'bg-[hsl(var(--status-negotiation))] text-white hover:bg-[hsl(var(--status-negotiation))]' },
    closed: { label: 'Closed', className: 'bg-[hsl(var(--status-closed))] text-white hover:bg-[hsl(var(--status-closed))]' },
    lost: { label: 'Lost', className: 'bg-[hsl(var(--status-lost))] text-white hover:bg-[hsl(var(--status-lost))]' },
  };

  const config = statusConfig[status];

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};
