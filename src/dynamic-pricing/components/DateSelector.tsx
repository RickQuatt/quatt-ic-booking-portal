import React from "react";
import classes from "./DateSelector.module.css";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      onDateChange(new Date(dateValue));
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const maxDate = formatDateForInput(new Date());

  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    onDateChange(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  const today = new Date();
  const isToday =
    formatDateForInput(selectedDate) === formatDateForInput(today);

  return (
    <div className={classes.container}>
      <label htmlFor="date-selector" className={classes.label}>
        Select date:
      </label>
      <div className={classes.dateNavigation}>
        <button
          onClick={handlePreviousDay}
          className={classes.navButton}
          title="Previous day"
        >
          ←
        </button>
        <input
          id="date-selector"
          type="date"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateChange}
          max={maxDate}
          className={classes.input}
        />
        <button
          onClick={handleNextDay}
          disabled={isToday}
          className={`${classes.navButton} ${isToday ? classes.disabled : ""}`}
          title="Next day"
        >
          →
        </button>
      </div>
    </div>
  );
}
