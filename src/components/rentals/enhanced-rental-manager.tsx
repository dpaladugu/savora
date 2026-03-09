/**
 * EnhancedRentalManager — migrated to useLiveQuery for real-time reactivity.
 * Shows live property/tenant data from db.rentalProperties and db.tenants.
 */
import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Users, AlertTriangle, TrendingUp, IndianRupee, Home } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';

export function EnhancedRentalManager() {
  const properties = useLiveQuery(
    () => db.rentalProperties?.toArray().catch(() => []) ?? Promise.resolve([]),
    [],
  ) ?? [];

  const tenants = useLiveQuery(
    () => db.tenants?.toArray().catch(() => []) ?? Promise.resolve([]),
    [],
  ) ?? [];

  const today = new Date();

  const activeTenants = useMemo(
    () => tenants.filter((t: any) => !t.endDate || new Date(t.endDate) > today),
    [tenants],
  );

  const analytics = useMemo(() => {
    const totalMonthlyIncome = (properties as any[]).reduce((s, p) => s + (p.monthlyRent ?? 0), 0);
    const totalAnnualTax     = (properties as any[]).reduce((s, p) => s + (p.propertyTaxAnnual ?? 0) + (p.waterTaxAnnual ?? 0), 0);
    const overdue = (properties as any[]).filter(p => today.getDate() > (p.dueDay ?? 5) + 5);
    return {
      totalProperties:              properties.length,
      totalMonthlyIncome,
      totalAnnualTax,
      avgRentPerProperty:           properties.length > 0 ? Math.round(totalMonthlyIncome / properties.length) : 0,
      propertiesWithOverdueRent:    overdue.length,
      overdueProperties:            overdue,
    };
  }, [properties, today]);

  const getPropertyTenants = (propertyId: string) =>
    activeTenants.filter((t: any) => t.propertyId === propertyId);

  if (!properties) {
    return <div className="flex justify-center items-center h-32 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Rental Management</h1>
          <p className="text-xs text-muted-foreground">Live from IndexedDB · properties &amp; tenants</p>
        </div>
      </div>

      {/* Overdue alert */}
      {analytics.overdueProperties.length > 0 && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive text-xs">
            {analytics.overdueProperties.length} property rent overdue — please follow up with tenants.
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { icon: Building,     label: 'Properties',       value: analytics.totalProperties },
          { icon: IndianRupee,  label: 'Monthly Income',   value: formatCurrency(analytics.totalMonthlyIncome) },
          { icon: TrendingUp,   label: 'Annual Taxes',     value: formatCurrency(analytics.totalAnnualTax) },
          { icon: Users,        label: 'Active Tenants',   value: activeTenants.length },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="glass">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <p className="text-lg font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Properties</h2>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Building className="h-10 w-10 mx-auto text-muted-foreground/25 mb-2" />
              <p className="text-sm text-muted-foreground">No rental properties yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the Property Rental Engine to add Guntur / Gorantla units.
              </p>
            </CardContent>
          </Card>
        ) : (
          (properties as any[]).map(property => {
            const pts      = getPropertyTenants(property.id);
            const isOverdue = analytics.overdueProperties.some((p: any) => p.id === property.id);

            return (
              <Card key={property.id} className={`glass ${isOverdue ? 'border-destructive/40' : 'border-border/40'}`}>
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">{property.address}</h3>
                        <Badge variant="outline" className="text-[10px]">{property.type}</Badge>
                        {property.owner && <Badge variant="outline" className="text-[10px]">{property.owner}</Badge>}
                        {isOverdue && <Badge variant="destructive" className="text-[10px]">Rent Overdue</Badge>}
                      </div>
                      {property.squareYards && (
                        <p className="text-xs text-muted-foreground">
                          {property.squareYards} sq yds · Due: {property.dueDay}th of month
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { label: 'Monthly Rent',   value: formatCurrency(property.monthlyRent ?? 0) },
                      { label: 'Property Tax',   value: `${formatCurrency(property.propertyTaxAnnual ?? 0)}/yr` },
                      { label: 'Water Tax',      value: `${formatCurrency(property.waterTaxAnnual ?? 0)}/yr` },
                      { label: 'Maintenance',    value: formatCurrency(property.maintenanceReserve ?? 0) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 rounded-lg p-2">
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="font-semibold text-foreground tabular-nums">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tenants */}
                  {pts.length > 0 && (
                    <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Tenants ({pts.length})
                      </p>
                      {pts.map((tenant: any) => (
                        <div key={tenant.id} className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium text-foreground">{tenant.tenantName}</span>
                            {tenant.roomNo && <span className="text-muted-foreground ml-1.5">Room {tenant.roomNo}</span>}
                          </div>
                          <div className="text-right">
                            <p className="font-medium tabular-nums">{formatCurrency(tenant.monthlyRent ?? 0)}/mo</p>
                            {tenant.joinDate && (
                              <p className="text-muted-foreground text-[10px]">
                                Since {new Date(tenant.joinDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
