
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Target, TrendingUp, Shield } from 'lucide-react';
import { db } from '@/db';
import { formatCurrency } from '@/lib/format-utils';
import { Logger } from '@/services/logger';
import { motion } from 'framer-motion';

export function EnhancedEmergencyFundCalculator() {
  const [efSettings, setEfSettings] = useState({
    efMonths: 6,
    targetAmount: 0,
    currentAmount: 0,
    medicalSubBucket: 200000,
    medicalSubBucketUsed: 0
  });
  
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load existing settings
      const settings = await db.getEmergencyFundSettings();
      
      // Calculate monthly expenses from recent data
      const expenses = await db.expenses.toArray();
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyTotal = expenses
        .filter(e => e.date.toString().startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);
      
      const calculatedTarget = monthlyTotal * settings.efMonths;
      
      setEfSettings({
        ...settings,
        targetAmount: calculatedTarget,
        currentAmount: settings.currentAmount || 0
      });
      
      setMonthlyExpenses(monthlyTotal);
      Logger.info('Emergency fund data loaded', { monthlyTotal, target: calculatedTarget });
      
    } catch (error) {
      Logger.error('Error loading emergency fund data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await db.saveEmergencyFundSettings(efSettings);
      Logger.info('Emergency fund settings saved');
    } catch (error) {
      Logger.error('Error saving emergency fund settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMonthsChange = (months: number) => {
    const newSettings = {
      ...efSettings,
      efMonths: months,
      targetAmount: monthlyExpenses * months
    };
    setEfSettings(newSettings);
  };

  const progressPercentage = efSettings.targetAmount > 0 
    ? Math.min(100, (efSettings.currentAmount / efSettings.targetAmount) * 100)
    : 0;

  const medicalProgress = efSettings.medicalSubBucket > 0
    ? Math.min(100, ((efSettings.medicalSubBucket - efSettings.medicalSubBucketUsed) / efSettings.medicalSubBucket) * 100)
    : 0;

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (progress: number) => {
    if (progress >= 100) return 'Target Achieved';
    if (progress >= 75) return 'On Track';
    if (progress >= 50) return 'Making Progress';
    return 'Below Target';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Emergency Fund Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Emergency Fund Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="months">Target Months Coverage</Label>
                <Select
                  value={efSettings.efMonths.toString()}
                  onValueChange={(value) => handleMonthsChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="9">9 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current">Current Amount</Label>
                <Input
                  id="current"
                  type="number"
                  value={efSettings.currentAmount}
                  onChange={(e) => setEfSettings(prev => ({
                    ...prev,
                    currentAmount: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="Enter current emergency fund amount"
                />
              </div>
            </div>

            {/* Progress Display */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progress</span>
                <span className={`text-sm font-semibold ${getStatusColor(progressPercentage)}`}>
                  {getStatusText(progressPercentage)} ({progressPercentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Current: {formatCurrency(efSettings.currentAmount)}</span>
                <span>Target: {formatCurrency(efSettings.targetAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Medical Sub-Bucket */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Medical Emergency Sub-Bucket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medical-budget">Medical Reserve</Label>
                <Input
                  id="medical-budget"
                  type="number"
                  value={efSettings.medicalSubBucket}
                  onChange={(e) => setEfSettings(prev => ({
                    ...prev,
                    medicalSubBucket: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="200000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical-used">Amount Used</Label>
                <Input
                  id="medical-used"
                  type="number"
                  value={efSettings.medicalSubBucketUsed}
                  onChange={(e) => setEfSettings(prev => ({
                    ...prev,
                    medicalSubBucketUsed: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Medical Reserve Available</span>
                <span className="text-sm font-semibold text-green-600">
                  {medicalProgress.toFixed(1)}%
                </span>
              </div>
              <Progress value={medicalProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights & Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">Monthly Target</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrency((efSettings.targetAmount - efSettings.currentAmount) / 12)}
                  </div>
                  <div className="text-xs text-muted-foreground">to reach goal in 12 months</div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center">
                  <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">Safety Score</div>
                  <div className="text-lg font-semibold text-green-600">
                    {progressPercentage >= 75 ? 'High' : progressPercentage >= 50 ? 'Medium' : 'Low'}
                  </div>
                  <div className="text-xs text-muted-foreground">financial security level</div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <div className="text-sm font-medium">Gap Amount</div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {formatCurrency(Math.max(0, efSettings.targetAmount - efSettings.currentAmount))}
                  </div>
                  <div className="text-xs text-muted-foreground">remaining to target</div>
                </div>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
