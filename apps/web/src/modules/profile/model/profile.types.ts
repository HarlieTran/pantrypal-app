export type PreferenceProfile = {
  likes: string[];
  dislikes: string[];
  dietSignals: string[];
  confidence: {
    likes: number;
    dislikes: number;
    overall: number;
  };
};

export type ProfileAnswer = {
  question: { key: string; label: string; type: string };
  option?: { label: string; value: string } | null;
  answerText?: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  preferenceProfile?: PreferenceProfile | null;
  answers?: ProfileAnswer[];
};

export type UpdateProfileInput = {
  displayName: string;
  likes: string;
  dietType: string[];
  allergies: string[];
  disliked: string;
  notes: string;
};

export type RecipeSelectionInput = {
  selectedImageIds: string[];
  rejectedImageIds: string[];
};
