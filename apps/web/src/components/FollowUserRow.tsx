import type { FamilyMember } from '../types/wishlist';

interface FollowUserRowProps {
  member: FamilyMember;
  familyName: string;
  onViewWishlist: (userId: number) => void;
}

export default function FollowUserRow({ member, familyName, onViewWishlist }: FollowUserRowProps) {
  return (
    <div className="follow-user-row">
      <div>
        <strong>{member.name}</strong>
        <span className="subtle"> &mdash; {familyName}</span>
      </div>
      <button className="secondary-action" onClick={() => onViewWishlist(member.id)}>
        View wishlist
      </button>
    </div>
  );
}
