import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "../utils/insightsFormatting";

interface SavingsCardProps {
  isExpanded: boolean;
  onToggle: () => void;
  totalCostSavings?: number | null;
  gasSavings: number;
  co2Savings: number;
  gasCostSavings?: number | null;
  electricityCostSavings?: number | null;
  co2GasSaved?: number | null;
  co2ElectricitySavings: number;
  hasTariffs: boolean;
}

export function SavingsCard({
  isExpanded,
  onToggle,
  totalCostSavings,
  gasSavings,
  co2Savings,
  gasCostSavings,
  electricityCostSavings,
  co2GasSaved,
  co2ElectricitySavings,
  hasTariffs,
}: SavingsCardProps) {
  const isNegativeSavings = totalCostSavings != null && totalCostSavings < 0;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onToggle}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Your Savings</CardTitle>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {/* Collapsed view */}
        <div className="flex items-baseline gap-2">
          {hasTariffs && totalCostSavings != null ? (
            <span
              className={`text-2xl font-bold ${isNegativeSavings ? "text-red-500" : ""}`}
            >
              {isNegativeSavings ? "-" : ""}
              {formatCurrency(totalCostSavings)}
            </span>
          ) : (
            <span className="text-lg text-muted-foreground">
              No tariffs configured
            </span>
          )}
        </div>

        <div className="mt-2 flex gap-2">
          {gasSavings > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {gasSavings.toFixed(gasSavings >= 100 ? 0 : 2)} m³ gas
            </span>
          )}
          {co2Savings > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {co2Savings.toFixed(co2Savings >= 100 ? 0 : 2)} kg CO₂
            </span>
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && hasTariffs && (
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas saved</span>
              <span>{formatCurrency(gasCostSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Quatt electricity cost
              </span>
              <span>-{formatCurrency(electricityCostSavings)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-medium">
              <span>Total savings</span>
              <span>{formatCurrency(totalCostSavings)}</span>
            </div>

            {(co2GasSaved != null || co2ElectricitySavings > 0) && (
              <div className="mt-3 space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  CO₂ breakdown
                </p>
                {co2GasSaved != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Gas CO₂ saved</span>
                    <span>
                      {co2GasSaved.toFixed(co2GasSaved >= 100 ? 0 : 2)} kg
                    </span>
                  </div>
                )}
                {co2ElectricitySavings > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Electricity CO₂
                    </span>
                    <span>
                      {co2ElectricitySavings.toFixed(
                        co2ElectricitySavings >= 100 ? 0 : 2,
                      )}{" "}
                      kg
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
