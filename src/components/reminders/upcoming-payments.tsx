
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, Home, Shield, TrendingUp, Clock, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/format-utils";

interface Reminder {
  id: string;
  title: string;
  amount?: number;
  dueDate: string;
  type: 'credit-card' | 'emi' | 'insurance' | 'rent' | 'sip' | 'tax' | 'other';
  status: 'upcoming' | 'due-today' | 'overdue';
  description?: string;
  autoDebit?: boolean;
}

export function UpcomingPayments() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    generateMockReminders();
  }, []);

  const generateMockReminders = () => {
    const today = new Date();
    const mockReminders: Reminder[] = [
      {
        id: '1',
        title: 'HDFC Regalia Credit Card',
        amount: 12500,
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'credit-card',
        status: 'upcoming',
        description: 'Minimum due: ₹625',
        autoDebit: false
      },
      {
        id: '2',
        title: 'Car Loan EMI',
        amount: 18500,
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'emi',
        status: 'upcoming',
        autoDebit: true
      },
      {
        id: '3',
        title: 'SIP - HDFC Index Fund',
        amount: 15000,
        dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'sip',
        status: 'due-today',
        autoDebit: true
      },
      {
        id: '4',
        title: 'Shop 1 Rent Collection',
        amount: 8500,
        dueDate: today.toISOString().split('T')[0],
        type: 'rent',
        status: 'due-today',
        description: 'From Ramesh - Shop 1, Koritepadu'
      },
      {
        id: '5',
        title: 'Health Insurance Premium',
        amount: 24000,
        dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'insurance',
        status: 'upcoming',
        description: 'Star Health Family Plan'
      },
      {
        id: '6',
        title: 'Property Tax - Gorantla',
        amount: 3500,
        dueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'tax',
        status: 'overdue',
        description: 'Municipal taxes for rental property'
      }
    ];

    setReminders(mockReminders);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'credit-card':
        return CreditCard;
      case 'emi':
        return TrendingUp;
      case 'insurance':
        return Shield;
      case 'rent':
        return Home;
      case 'sip':
        return TrendingUp;
      case 'tax':
        return Calendar;
      default:
        return Bell;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800';
      case 'due-today':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800';
      case 'upcoming':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-900/10 dark:border-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due-today':
        return 'Due Today';
      case 'upcoming':
        return 'Upcoming';
      default:
        return '';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const todayReminders = reminders.filter(r => r.status === 'due-today' || r.status === 'overdue');
  const upcomingReminders = reminders.filter(r => r.status === 'upcoming');

  const totalDueAmount = todayReminders.reduce((sum, reminder) => sum + (reminder.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          Reminders & Payments
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Track upcoming payments and due dates
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(totalDueAmount)}</div>
                <div className="text-sm text-muted-foreground">Due Today/Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{reminders.length}</div>
                <div className="text-sm text-muted-foreground">Total Reminders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Reminders */}
      {todayReminders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            Action Required
          </h2>
          {todayReminders.map((reminder) => {
            const Icon = getIcon(reminder.type);
            return (
              <Card key={reminder.id} className={getStatusColor(reminder.status)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-semibold text-foreground">{reminder.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getDaysUntilDue(reminder.dueDate)}
                          {reminder.description && ` • ${reminder.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {reminder.amount && (
                        <div className="text-lg font-bold text-foreground">₹{reminder.amount.toLocaleString()}</div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          reminder.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {getStatusLabel(reminder.status)}
                        </span>
                        {reminder.autoDebit && (
                          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                            Auto-debit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Upcoming This Week</h2>
          {upcomingReminders.map((reminder) => {
            const Icon = getIcon(reminder.type);
            return (
              <Card key={reminder.id} className={getStatusColor(reminder.status)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-semibold text-foreground">{reminder.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getDaysUntilDue(reminder.dueDate)}
                          {reminder.description && ` • ${reminder.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {reminder.amount && (
                        <div className="text-lg font-bold text-foreground">₹{reminder.amount.toLocaleString()}</div>
                      )}
                      <div className="flex items-center gap-2">
                        {reminder.autoDebit && (
                          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                            Auto-debit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="metric-card border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-3">Reminder Categories</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">Payments Out:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Credit card bills</li>
                <li>• EMI payments</li>
                <li>• Insurance premiums</li>
                <li>• Tax payments</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Income In:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Rental collections</li>
                <li>• Investment maturity</li>
                <li>• Salary credit</li>
                <li>• Interest payments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
