export interface Profile {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    birthday: string | null;
    createdAt: string;
    updatedAt: string;
    anniversaries: {
      id: string;
      label: string;
      date: string;
      isPrimary: boolean;
    }[];
    wishlistLinks: {
      id: string;
      label: string;
      url: string;
    }[];
  }