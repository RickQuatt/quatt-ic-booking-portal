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
  valueColor?: TextColor;
}

const stylesMarginZero = { margin: "0" };

export const TextColor = {
  BLACK: "black",
  GREEN: "green",
  RED: "red",
} as const;

export type TextColor = (typeof TextColor)[keyof typeof TextColor];

function DetailBlock({
  title,
  value,
  unitSuffix = UnitSuffix.NONE,
  children,
  fallback = "N/A",
  valueColor = TextColor.BLACK,
}: DetailBlockProps) {
  const valueStyle = { margin: "0", color: valueColor };
  const hasValue = value !== null && value !== undefined;
  const hasFalsyChildren =
    Array.isArray(children) && children.every((child) => !child);
  const noChildren = !children || hasFalsyChildren;

  return (
    <div>
      <h3 style={stylesMarginZero}>{title}</h3>
      {hasValue && (
        <h2 style={valueStyle}>
          {value}
          {unitSuffix}
        </h2>
      )}
      {children && children}
      {!value && noChildren && <h2 style={stylesMarginZero}>{fallback}</h2>}
    </div>
  );
}

export default DetailBlock;
