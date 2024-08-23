export const UnitSuffix = {
  PERCENTAGE: "%",
  DEGREES_CELSIUS: "°C",
  NONE: "",
} as const;

export type UnitSuffix = (typeof UnitSuffix)[keyof typeof UnitSuffix];

interface DetailBlockProps {
  title: string;
  value?: string | number | null;
  unitSuffix?: UnitSuffix;
  fallback?: string;
  children?: React.ReactNode;
}

const stylesMarginZero = { margin: "0" };

function DetailBlock({
  title,
  value,
  unitSuffix = UnitSuffix.NONE,
  children,
  fallback = "N/A",
}: DetailBlockProps) {
  return (
    <div>
      <h3 style={stylesMarginZero}>{title}</h3>
      {value && (
        <h2 style={stylesMarginZero}>
          {value}
          {unitSuffix}
        </h2>
      )}
      {children && children}
      {!value && !children && <h2 style={stylesMarginZero}>{fallback}</h2>}
    </div>
  );
}

export default DetailBlock;
