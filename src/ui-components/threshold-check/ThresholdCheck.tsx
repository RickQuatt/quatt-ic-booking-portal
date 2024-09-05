import DetailBlock, {
  UnitSuffix,
  TextColor,
} from "../detail-block/DetailBlock";

interface ThresholdCheckProps {
  title: string;
  displayValue?: string | number | null;
  thresholdValue?: number;
  unitSuffix?: UnitSuffix;
  lowerThreshold?: number;
  lowerThresholdMessage?: string;
  upperThreshold?: number;
  upperThresholdMessage?: string;
  children?: React.ReactNode;
}

function ThresholdCheck({
  title,
  displayValue,
  thresholdValue,
  unitSuffix = UnitSuffix.NONE,
  lowerThreshold,
  lowerThresholdMessage,
  upperThreshold,
  upperThresholdMessage,
  children,
}: ThresholdCheckProps) {
  const value = thresholdValue || displayValue;
  const lowerThresholdPassed =
    lowerThreshold && typeof value === "number" && value < lowerThreshold;
  const upperThresholdPassed =
    upperThreshold && typeof value === "number" && value > upperThreshold;
  const thresholdPassed = lowerThresholdPassed || upperThresholdPassed;
  const warningMessage = lowerThresholdMessage || upperThresholdMessage;
  const valueColor = thresholdPassed ? TextColor.RED : TextColor.BLACK;

  return (
    <DetailBlock
      title={title}
      value={displayValue}
      unitSuffix={unitSuffix}
      valueColor={valueColor}
    >
      {children}
      {thresholdPassed && (
        <span style={{ color: TextColor.RED }}>{warningMessage}</span>
      )}
    </DetailBlock>
  );
}

export default ThresholdCheck;
