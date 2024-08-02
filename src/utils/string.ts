// TODO: add tests once a testing framework is in place
export const prependPrefixIfMissing = (
  prefix: string,
  value: string,
): string => (value.toUpperCase().startsWith(prefix) ? value : prefix + value);
