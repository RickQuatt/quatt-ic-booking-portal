export const fuzzyMatch = (field: string | null, search: string) => {
  if (field === null) return false;
  return field.toLowerCase().includes(search.toLowerCase());
};

export const stringToBoolean = (value: string) => {
  return value === "true" ? true : false;
};
