import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface ConfidenceGaugeProps {
  confidence: number;
}

export const ConfidenceGauge = ({ confidence }: ConfidenceGaugeProps) => {
  const getColor = () => {
    if (confidence >= 80) return "text-success";
    if (confidence >= 60) return "text-primary";
    return "text-destructive";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Confidence Level
        </span>
        <span className={`font-semibold ${getColor()}`}>{confidence}%</span>
      </div>
      <Progress value={confidence} className="h-2" />
      {confidence < 65 && (
        <p className="text-xs text-muted-foreground italic">
          Low confidence - consider providing more text for better accuracy
        </p>
      )}
    </div>
  );
};
