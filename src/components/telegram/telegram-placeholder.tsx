
import { motion } from "framer-motion";
import { MessageCircle, Mic, FileText, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TelegramPlaceholder() {
  const features = [
    {
      icon: Mic,
      title: "Voice Expense Entry",
      description: "Say 'Spent ₹200 on coffee' and it's automatically logged"
    },
    {
      icon: MessageCircle,
      title: "Quick Commands",
      description: "Ask 'How much did I spend on food this week?' and get instant answers"
    },
    {
      icon: FileText,
      title: "CSV Upload via Chat",
      description: "Send your bank statements directly through Telegram"
    },
    {
      icon: Bot,
      title: "Smart Categorization",
      description: "AI-powered expense categorization and insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-24 pt-16 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Telegram Bot
          </h1>
          <Badge variant="secondary" className="text-xs">
            Coming Soon
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg font-medium">
          Manage your finances through Telegram
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="metric-card border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-blue w-fit">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl">Telegram Integration</CardTitle>
              <p className="text-muted-foreground">
                Experience the future of expense tracking with our Telegram bot
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="p-4 rounded-xl bg-background/60 border border-border/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Demo Commands */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Example Commands</h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                    <code className="text-sm text-foreground">/expense ₹500 groceries</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quickly log an expense
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                    <code className="text-sm text-foreground">/summary this month</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get spending summary
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                    <code className="text-sm text-foreground">/budget food ₹10000</code>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set category budget
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm text-foreground">
                  <strong>Stay tuned!</strong> The Telegram bot will be available in the next update.
                  Follow our GitHub for announcements.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
