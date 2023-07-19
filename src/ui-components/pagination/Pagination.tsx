import React from "react";
import { DOTS, PaginationRange } from "./usePaginate";

import classes from "./Pagination.module.css";
import classNames from "classnames";

interface Props {
  paginationRange: PaginationRange;
  currentPage: number;
  changePage: (page: number) => void;
}

export function Pagination({
  paginationRange,
  currentPage,
  changePage,
}: Props) {

  const nextPage = React.useCallback(() => {
    changePage(currentPage + 1);
  }, [changePage, currentPage]);

  const prevPage = React.useCallback(() => {
    changePage(currentPage - 1);
  }, [changePage, currentPage]);

  if (paginationRange.length < 2) {
    return null;
  }

  const lastPage = paginationRange[paginationRange.length - 1];
  return (
    <ul className={classes.pagination}>
      <li
        className={classNames(classes["pagination-item"], {
          [classes.disabled]: currentPage === 1,
        })}
        onClick={prevPage}
      >
        {"<"}
      </li>

      {paginationRange.map((value, i) => {
        if (value === DOTS) {
          return <li key={i} className={classes['pagination-item']}>...</li>
        }

        return (
          <li
            key={i}
            className={classNames(classes["pagination-item"], {
              [classes.active]: currentPage === value,
            })}
            onClick={() => changePage(value)}
          >
            {value}
          </li>
        )
      })}
      <li
        className={classNames(classes["pagination-item"], {
          [classes.disabled]: currentPage === lastPage,
        })}
        onClick={nextPage}
      >
        {">"}
      </li>
    </ul>
  );
}
