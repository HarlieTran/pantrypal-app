export type HomeSpecial = {
  dishName?: string;
  cuisine?: string | null;
  origin?: string | null;
  description?: string | null;
  history?: string | null;
  culturalMeaning?: string | null;
  inspiredBy?: string | null;
  funFact?: string | null;
  imageUrl?: string | null;
};

export type CommunityPost = {
  id: string;
  title: string;
  author: string;
};

export type PreferenceProfile = {
  likes: string[];
  dislikes: string[];
  dietSignals: string[];
  confidence: { likes: number; dislikes: number; overall: number };
};
