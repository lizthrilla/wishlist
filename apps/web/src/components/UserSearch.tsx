interface UserSearchPropsType {
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
}

const UserSearch = ({ onChange, onSubmit, value }: UserSearchPropsType) => {
  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-md mx-auto py-2">
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="submit"
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Search
      </button>
    </form>
  );
};

export default UserSearch;
