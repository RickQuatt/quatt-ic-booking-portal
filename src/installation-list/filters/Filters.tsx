import { DateRangeFilter } from "../../ui-components/filter/DateRangeFilter";
import { TextFilter } from "../../ui-components/filter/TextFilter";
import { InstallationFilters } from "./types";

type SetFiltersFunc = (
  setFiltersFunc: (oldFilters: InstallationFilters) => InstallationFilters,
) => void;
type FilterProps = { setFilters: SetFiltersFunc };

export function OrderNumberFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"orderNumber"} />;
}

/*
//HAUNTED-HOUSE ignore until haunted house code is merged
export function ZipCodeFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"zipCode"} />;
}

export function HouseNumberFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"houseNumber"} />;
}

export function HouseAdditionNumberFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"houseAddition"} />;
}
*/

export function ActiveCicFilter({ setFilters }: FilterProps) {
  return <TextFilter setFilters={setFilters} filterKey={"cicId"} />;
}

export function CreatedAtFilter({ setFilters }: FilterProps) {
  return (
    <DateRangeFilter
      setFilters={setFilters}
      minFilterKey="minCreatedAt"
      maxFilterKey="maxCreatedAt"
    />
  );
}

export function UpdatedAtFilter({ setFilters }: FilterProps) {
  return (
    <DateRangeFilter
      setFilters={setFilters}
      minFilterKey="minCreatedAt"
      maxFilterKey="maxCreatedAt"
    />
  );
}
