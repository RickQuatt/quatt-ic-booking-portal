import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatPower } from "../utils/insightsFormatting";

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
  quattElectricityConsumed?: number | null;
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
  quattElectricityConsumed,
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
          <div className="mt-6 space-y-5 border-t pt-6">
            {/* Gas saved by using Quatt */}
            <div>
              <div className="mb-2 text-sm font-medium">
                Gas saved by using Quatt
              </div>
              <div className="grid grid-cols-3 gap-4 text-base">
                <span className="font-semibold">
                  {formatCurrency(gasCostSavings)}
                </span>
                <span className="text-muted-foreground">
                  {gasSavings.toFixed(gasSavings >= 100 ? 0 : 2)} m³
                </span>
                {co2GasSaved != null && (
                  <span className="text-muted-foreground">
                    {co2GasSaved.toFixed(co2GasSaved >= 100 ? 0 : 2)} kg CO₂
                  </span>
                )}
              </div>
            </div>

            {/* Quatt consumption */}
            <div>
              <div className="mb-2 text-sm font-medium">Quatt consumption</div>
              <div className="grid grid-cols-3 gap-4 text-base">
                <span className="font-semibold">
                  {formatCurrency(electricityCostSavings)}
                </span>
                {quattElectricityConsumed != null && (
                  <span className="text-muted-foreground">
                    {formatPower(quattElectricityConsumed).value}{" "}
                    {formatPower(quattElectricityConsumed).label}
                  </span>
                )}
                {co2ElectricitySavings > 0 && (
                  <span className="text-muted-foreground">
                    {co2ElectricitySavings.toFixed(
                      co2ElectricitySavings >= 100 ? 0 : 2,
                    )}{" "}
                    kg CO₂
                  </span>
                )}
              </div>
            </div>

            {/* Total savings */}
            <div className="border-t pt-5">
              <div className="mb-2 text-sm font-medium">Total savings</div>
              <div className="grid grid-cols-3 gap-4 text-base">
                <span className="font-semibold">
                  = {formatCurrency(totalCostSavings)}
                </span>
                <span></span>
                {co2Savings > 0 && (
                  <span className="text-muted-foreground">
                    {co2Savings.toFixed(co2Savings >= 100 ? 0 : 2)} kg CO₂
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
