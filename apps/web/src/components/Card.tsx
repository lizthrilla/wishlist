import type { CardProps } from '../types/wishlist';

const Card = (item: CardProps) => {
  const handleClick = (id: number) => {
    item.onDelete(id);
  };
  return (
    <div className="max-w-sm rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition duration-200 border border-gray-100">
      <div className="flex flex-col justify-between h-full space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
          <h4 className="font-semibold text-gray-900">
            {item.ownerName}: {item.wishlistTitle}
          </h4>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline break-all"
          >
            {item.url}
          </a>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Price</span>
          <span className="text-xl font-bold text-gray-900">{item.price}</span>
        </div>
        <button onClick={() => handleClick(item.id)}>Delete</button>
      </div>
    </div>
  );
};

export default Card;
