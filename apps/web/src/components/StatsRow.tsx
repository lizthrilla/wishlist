interface StatsRowProps {
  myItemCount: number;
  myWishlistCount: number;
  familyCount: number;
}

export default function StatsRow({ myItemCount, myWishlistCount, familyCount }: StatsRowProps) {
  return (
    <div className="stats-row">
      <span className="pill">{myItemCount} {myItemCount === 1 ? 'item' : 'items'}</span>
      <span className="pill">{myWishlistCount} {myWishlistCount === 1 ? 'wishlist' : 'wishlists'}</span>
      <span className="pill">{familyCount} {familyCount === 1 ? 'family' : 'families'}</span>
    </div>
  );
}
