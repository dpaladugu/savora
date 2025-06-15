
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SipRecommendationProps {
  shortfall: number;
}

export function SipRecommendation({ shortfall }: SipRecommendationProps) {
  if (shortfall <= 0) return null;

  return (
    <Card className="metric-card border-border/50">
      <CardHeader>
        <CardTitle>SIP Recommendation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-2">Suggested Monthly SIP</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">12 months:</span>
              <div className="font-semibold">₹{Math.round(shortfall / 12).toLocaleString()}/month</div>
            </div>
            <div>
              <span className="text-muted-foreground">24 months:</span>
              <div className="font-semibold">₹{Math.round(shortfall / 24).toLocaleString()}/month</div>
            </div>
            <div>
              <span className="text-muted-foreground">36 months:</span>
              <div className="font-semibold">₹{Math.round(shortfall / 36).toLocaleString()}/month</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Recommended: Liquid funds or Conservative Hybrid funds for emergency corpus
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
