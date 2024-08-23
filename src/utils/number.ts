export const roundNumber = (num?: number, decimals = 2) => {
  if (num === undefined) {
    return undefined;
  }

  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
