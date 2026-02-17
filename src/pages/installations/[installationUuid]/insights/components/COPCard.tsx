import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatPowerString } from "../utils/insightsFormatting";

interface COPCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  copValue?: number | null;
  totalHeatProduced?: number;
  totalElectricPowerConsumption?: number;
}

export function COPCard({
  isExpanded,
  onToggle,
  copValue,
  totalHeatProduced,
  totalElectricPowerConsumption,
}: COPCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onToggle}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Average COP</CardTitle>
        <div className="flex items-center gap-2">
          {copValue != null && (
            <span className="text-2xl font-bold">{copValue.toFixed(1)}</span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {copValue == null && (
          <span className="text-sm text-muted-foreground">Not enough data</span>
        )}

        {isExpanded && copValue != null && (
          <div className="mt-2 space-y-3 border-t pt-4 text-sm">
            <p className="text-muted-foreground">
              COP (Coefficient of Performance) shows how efficiently the heat
              pump converts electricity into heat.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Heat delivered</span>
                <span>{formatPowerString(totalHeatProduced)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Electricity used</span>
                <span>{formatPowerString(totalElectricPowerConsumption)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>COP</span>
                <span>
                  {formatPowerString(totalHeatProduced)} /{" "}
                  {formatPowerString(totalElectricPowerConsumption)} ={" "}
                  {copValue.toFixed(1)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              A COP of {copValue.toFixed(1)} means the heat pump produces{" "}
              {copValue.toFixed(1)}x more heat energy than the electrical energy
              it consumes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
