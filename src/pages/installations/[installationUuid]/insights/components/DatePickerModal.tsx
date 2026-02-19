import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

interface DatePickerModalProps {
  open: boolean;
  selectedDate: Date;
  minimumDate: Date;
  maximumDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export function DatePickerModal({
  open,
  selectedDate,
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
}: DatePickerModalProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate);

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      onConfirm(newDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto !flex !flex-col gap-2 p-4">
        <DialogHeader>
          <DialogTitle>Select date</DialogTitle>
        </DialogHeader>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => d < minimumDate || d > maximumDate}
          defaultMonth={selectedDate}
          weekStartsOn={1}
          className="!w-full [--cell-size:2.5rem]"
        />
      </DialogContent>
    </Dialog>
  );
}
