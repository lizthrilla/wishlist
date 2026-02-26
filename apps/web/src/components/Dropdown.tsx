export interface DropdownProps {
  limit: number;
  setLimit: (value: number) => void;
  setCurrentPage: (value: number) => void;
  totalItems: number | undefined;
}

export default function Dropdown({ limit, setLimit, setCurrentPage, totalItems }: DropdownProps) {
  return (
    <>
      <p>Total number of items: {totalItems}</p>
      <label className="text-sm text-gray-300 mt-4">
        Items per page
        <select
          className="ml-2 rounded px-2 py-1 text-black"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={2}>2</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>
    </>
  );
}
