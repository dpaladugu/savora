
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Upload, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { GlobalHeader } from "@/components/layout/global-header"; // Removed

export function TelegramIntegration() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const { toast } = useToast();

  const botUsername = 'SavoraFinanceBot'; // This would be your actual bot username

  const handleConnect = async () => {
    if (!botToken || !chatId) {
      toast({
        title: "Missing Information",
        description: "Please provide both bot token and chat ID",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus('connecting');
    
    // Simulate connection process
    setTimeout(() => {
      // Store connection details securely
      localStorage.setItem('telegram-bot-token', botToken);
      localStorage.setItem('telegram-chat-id', chatId);
      
      setConnectionStatus('connected');
      toast({
        title: "Connected!",
        description: "Telegram bot is now connected to your Savora account",
      });
    }, 2000);
  };

  const copyBotCommands = () => {
    const commands = `/start - Initialize bot connection
/add_expense <amount> <category> <mode> [note] - Add expense
/import_csv - Upload CSV file for processing
/monthly_summary - Get current month expense summary
/emergency_fund - Check emergency fund status
/help - Show all commands`;

    navigator.clipboard.writeText(commands);
    toast({
      title: "Copied!",
      description: "Bot commands copied to clipboard",
    });
  };

  return (
    // Removed min-h-screen, bg-gradient, GlobalHeader, and pt-20.
    // These are expected to be handled by the parent router using ModuleHeader.
    <div className="space-y-6">
      <Card className="metric-card border-border/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Telegram Bot Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Getting Started</h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>1. Search for @{botUsername} on Telegram</li>
                <li>2. Send /start to the bot</li>
                <li>3. Copy your Chat ID from the bot response</li>
                <li>4. Enter the connection details below</li>
              </ol>
            </div>

            {connectionStatus === 'disconnected' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bot Token (Contact Support)
                  </label>
                  <Input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter bot token from support"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Chat ID
                  </label>
                  <Input
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="Get this from @SavoraFinanceBot"
                  />
                </div>

                <Button onClick={handleConnect} className="w-full">
                  Connect Telegram Bot
                </Button>
              </div>
            )}

            {connectionStatus === 'connecting' && (
              <div className="text-center py-6">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Connecting to Telegram...</p>
              </div>
            )}

            {connectionStatus === 'connected' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Connected to Telegram Bot</span>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Bot Commands</h4>
                  <div className="text-sm text-green-700 dark:text-green-300 font-mono space-y-1">
                    <div>/add_expense 500 Food UPI Coffee at cafe</div>
                    <div>/import_csv (attach CSV file)</div>
                    <div>/monthly_summary</div>
                    <div>/emergency_fund</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBotCommands}
                    className="mt-3"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Commands
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadHistory.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Uploads Yet</h3>
                <p className="text-muted-foreground">
                  Files uploaded via Telegram will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadHistory.map((upload, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">{upload.filename}</h4>
                      <p className="text-sm text-muted-foreground">{upload.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === 'processed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                      <span className="text-sm">{upload.recordsProcessed} records</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="metric-card border-border/50">
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• All data is encrypted end-to-end between Telegram and your Firebase account</p>
              <p>• Bot only responds to your verified Chat ID</p>
              <p>• CSV files are processed in memory and not stored on our servers</p>
              <p>• You can disconnect the bot anytime from this screen</p>
              <p>• No financial data is stored on Telegram servers</p>
            </div>
            
            {connectionStatus === 'connected' && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setConnectionStatus('disconnected');
                  localStorage.removeItem('telegram-bot-token');
                  localStorage.removeItem('telegram-chat-id');
                  toast({
                    title: "Disconnected",
                    description: "Telegram bot has been disconnected",
                  });
                }}
              >
                Disconnect Bot
              </Button>
            )}
          </CardContent>
        </Card>
      {/* Removed extra closing </div> tag that was here */}
    </div>
  );
}
