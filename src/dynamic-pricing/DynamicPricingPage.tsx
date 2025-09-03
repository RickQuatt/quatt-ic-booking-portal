import { useState } from "react";
import classes from "./DynamicPricingPage.module.css";
import { DateSelector } from "./components/DateSelector";
import { PricingChart } from "./components/PricingChart";
import { Loader } from "../ui-components/loader/Loader";
import ErrorText from "../ui-components/error-text/ErrorText";
import { usePricingData } from "./hooks/usePricingData";

export function DynamicPricingPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data, isLoading, isError, refetch } = usePricingData(selectedDate);

  const currentPrice = data?.currentPrice;
  const pricingData = data?.hourlyPrices || [];

  if (isError) {
    return (
      <div className={classes.container}>
        <h1 className={classes.title}>Dynamic Pricing</h1>
        <ErrorText
          text="Failed to fetch dynamic pricing data."
          retry={refetch}
        />
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>Dynamic Pricing</h1>
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {currentPrice && (
        <div className={classes.currentPrice}>
          Current electricity price: €{currentPrice.toFixed(2)} per kWh
        </div>
      )}

      <div className={classes.chartContainer}>
        <h2 className={classes.sectionTitle}>Electricity prices</h2>
        {isLoading ? (
          <div className={classes.loaderContainer}>
            <Loader />
          </div>
        ) : (
          <PricingChart data={pricingData} selectedDate={selectedDate} />
        )}
      </div>
    </div>
  );
}
