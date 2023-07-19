import React from "react";

export const DOTS = 'dots'

export type PaginationRange = (typeof DOTS | number)[]

/*
  Create an array of certain length and set the elements within it from
  start value to end value.
*/
const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

export function usePaginate<T>({ items, pageSize = 50, siblingCount = 1 }: {
  items: T[];
  pageSize?: number,
  siblingCount?: number
}) {
  const [currentPage, doChangePage] = React.useState(1)

  const totalPageCount = React.useMemo(() => {
    return Math.ceil(items.length / pageSize)
  }, [items.length, pageSize])

  const changePage = React.useCallback((page: number) => {
    if (page < 1 || page > totalPageCount) return;
    doChangePage(page)
  }, [totalPageCount])

  const paginationRange = React.useMemo(() => {
    const maxPageNumbers = siblingCount*2 + 5

    // case 1: can show all page numbers
    if (totalPageCount < maxPageNumbers) {
      return range(1, totalPageCount)
    }  

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount)

    // case 2: can show all page numbers
    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2

    const firstPageIndex = 1
    const lastPageIndex = totalPageCount

    // case 2: no left dots, only right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftRange = range(1, 3 + 2 * siblingCount)
      return [...leftRange, DOTS, lastPageIndex]
    }

    // case 3: no right dots, only left dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount
      );
      return [firstPageIndex, DOTS, ...rightRange]
    }

    // case 4: show both left and right dots
    const middleRange = range(leftSiblingIndex, rightSiblingIndex)
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex]

  }, [
    totalPageCount,
    currentPage,
    siblingCount
  ])

  const paginatedItems = React.useMemo(() => {
    const firstPageIndex = (currentPage - 1) * pageSize;
    const lastPageIndex = firstPageIndex + pageSize;
    return items.slice(firstPageIndex, lastPageIndex)
  }, [
    items,
    currentPage,
    pageSize
  ])

  return {
    paginationRange: paginationRange as PaginationRange,
    currentPage,
    changePage,
    paginatedItems
  }
}
