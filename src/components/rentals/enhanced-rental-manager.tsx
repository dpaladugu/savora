
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Users, AlertTriangle, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { RentalPropertyService } from '@/services/RentalPropertyService';
import { TenantService } from '@/services/TenantService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format-utils';
import type { RentalProperty, Tenant } from '@/lib/db-schema-extended';

export function EnhancedRentalManager() {
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [analytics, setAnalytics] = useState({
    totalProperties: 0,
    totalMonthlyIncome: 0,
    totalAnnualTax: 0,
    avgRentPerProperty: 0,
    propertiesWithOverdueRent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propertiesData, tenantsData, analyticsData] = await Promise.all([
        RentalPropertyService.getAllProperties(),
        TenantService.getAllTenants(),
        RentalPropertyService.getRentalAnalytics()
      ]);
      
      setProperties(propertiesData);
      setTenants(tenantsData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to load rental data');
      console.error('Error loading rental data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyTenants = (propertyId: string) => {
    return tenants.filter(tenant => tenant.propertyId === propertyId && (!tenant.endDate || tenant.endDate > new Date()));
  };

  const getOverdueRent = () => {
    const today = new Date();
    const currentDay = today.getDate();
    
    return properties.filter(property => currentDay > property.dueDay + 5); // 5 days grace period
  };

  const overdueProperties = getOverdueRent();

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading rental management...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Rental Management</h1>
          <p className="text-muted-foreground">Comprehensive rental property and tenant management</p>
        </div>
      </div>

      {/* Overdue Rent Alert */}
      {overdueProperties.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {overdueProperties.length} property(ies) have overdue rent. Please follow up with tenants.
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="w-4 h-4" />
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProperties}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalMonthlyIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Annual Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalAnnualTax)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.filter(t => !t.endDate || t.endDate > new Date()).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Properties Overview</h2>
        {properties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No rental properties found. Add your first property to get started!</p>
            </CardContent>
          </Card>
        ) : (
          properties.map((property) => {
            const propertyTenants = getPropertyTenants(property.id);
            const isOverdue = overdueProperties.some(p => p.id === property.id);
            const occupancyRate = propertyTenants.length > 0 ? 100 : 0;

            return (
              <Card key={property.id} className={isOverdue ? 'border-red-200' : ''}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{property.address}</h3>
                        <Badge variant="outline">{property.type}</Badge>
                        <Badge variant="outline">{property.owner}</Badge>
                        {isOverdue && <Badge variant="destructive">Rent Overdue</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {property.squareYards} sq yards | Due: {property.dueDay}th of every month
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Monthly Rent:</span>
                      <p className="font-medium">{formatCurrency(property.monthlyRent)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Property Tax:</span>
                      <p className="font-medium">{formatCurrency(property.propertyTaxAnnual)}/year</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Water Tax:</span>
                      <p className="font-medium">{formatCurrency(property.waterTaxAnnual)}/year</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Occupancy:</span>
                      <p className="font-medium">{occupancyRate}%</p>
                    </div>
                  </div>

                  {/* Tenants */}
                  {propertyTenants.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Current Tenants:</h4>
                      {propertyTenants.map(tenant => (
                        <div key={tenant.id} className="flex justify-between items-center py-2">
                          <div>
                            <span className="font-medium">{tenant.tenantName}</span>
                            <span className="text-sm text-muted-foreground ml-2">Room: {tenant.roomNo}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Rent: {formatCurrency(tenant.monthlyRent)}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {tenant.joinDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Maintenance Reserve */}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Maintenance Reserve:</span>
                    <span className="font-medium">{formatCurrency(property.maintenanceReserve)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
