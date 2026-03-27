interface AppHeaderProps {
  userName: string;
  onSignOut: () => void;
}

export default function AppHeader({ userName, onSignOut }: AppHeaderProps) {
  return (
    <div className="app-header">
      <div>
        <p className="eyebrow">Wishlist</p>
        <h1>Wishlists</h1>
        <p className="subtle">Signed in as {userName}</p>
      </div>
      <button className="secondary-action" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
