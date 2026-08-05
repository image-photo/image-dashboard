"use client";

type TablePaginationProps = {
  currentPage: number;
  itemLabel: string;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const pageSizeOptions = [5, 10, 25, 50];

export default function TablePagination({
  currentPage,
  itemLabel,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <label htmlFor={`page-size-${itemLabel}`} className="font-medium">
          Show
        </label>
        <select
          id={`page-size-${itemLabel}`}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>per page</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-600">
          Showing {firstItem}–{lastItem} of {totalItems} {itemLabel}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="min-w-24 text-center text-sm font-medium text-slate-700">
            Page {safePage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
