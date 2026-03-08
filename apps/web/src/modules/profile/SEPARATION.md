# Profile Module - Separation of Concerns

## Structure

```
profile/
├── model/           # Data types and constants
├── infra/           # API integration
├── application/     # Business logic hooks
├── ui/              # Pure presentation components
└── index.ts         # Public exports
```

## Analysis

The profile module is **already properly separated** and demonstrates excellent separation of concerns.

## Layer Responsibilities

### model/ - Domain Types ✅
**Purpose**: Define data structures and constants

**Files**:
- `profile.types.ts`
  - `UserProfile` - User profile data
  - `PreferenceProfile` - AI-generated taste profile
  - `ProfileAnswer` - Questionnaire answer
  - `UpdateProfileInput` - Profile update payload
  - `RecipeSelectionInput` - Recipe selection payload
  
- `profile.constants.ts`
  - `DIETS` - Available diet types
  - `ALLERGIES` - Common allergies

**Status**: ✅ Complete - Types and constants properly defined

### infra/ - API Integration ✅
**Purpose**: Handle HTTP communication with backend

**Files**:
- `profile.api.ts` - API client functions
  - `fetchProfile()` - Get user profile
  - `saveProfile()` - Update profile
  - `submitProfileRecipeSelections()` - Submit AI recipe picks

**Dependencies**:
- Uses shared `lib/api` client
- Imports types from `model/`

**Status**: ✅ Complete - Pure API calls

### application/ - Business Logic ✅
**Purpose**: Manage state and orchestrate business operations

**Files**:
- `useProfilePageData.ts` - Profile page data loading
  - Loads user profile
  - Manages loading/error states
  
- `useEditProfileForm.ts` - Profile editing workflow
  - Loads existing profile data
  - Manages form state (name, likes, diet, allergies, etc.)
  - Handles multi-view navigation (form ↔ AI-assist)
  - Prefills form from questionnaire answers
  - Saves profile updates
  - Integrates AI recipe picker for preference suggestions
  
- `profileViewModel.ts` - View model transformation
  - Transforms raw profile data into display format
  - Extracts questionnaire answers
  - Formats dates

**Dependencies**:
- Imports types from `model/`
- Calls functions from `infra/`
- React hooks (useState, useEffect)

**Status**: ✅ Complete - All business logic properly abstracted

### ui/ - Presentation ✅
**Purpose**: Render UI based on props and callbacks

**Files**:
- `pages/ProfilePage.tsx` - Profile display page
  - Uses `useProfilePageData` hook
  - Uses `buildProfileViewModel` for data transformation
  - Pure presentation with sub-components
  
- `pages/EditProfilePage.tsx` - Profile editing page
  - Uses `useEditProfileForm` hook
  - Manages multi-view layout (form ↔ AI-assist)
  - Pure presentation

**Dependencies**:
- Uses hooks from `application/`
- Imports types and constants from `model/`

**Status**: ✅ Complete - Pure presentation, no business logic

## Key Patterns

### 1. View Model Pattern
```tsx
// application/profileViewModel.ts
export function buildProfileViewModel(profile: UserProfile | null) {
  // Transform raw data into display format
  return {
    pref: profile?.preferenceProfile,
    memberSince: formatDate(profile?.createdAt),
    allergyAnswers: extractAnswers(profile, 'allergies'),
    // ...
  };
}

// ui/ProfilePage.tsx
const { pref, memberSince, allergyAnswers } = buildProfileViewModel(profile);
```

### 2. Complex Form State Management
```tsx
// application/useEditProfileForm.ts
export function useEditProfileForm({ token, displayName }) {
  // Manages all form state
  const [name, setName] = useState(displayName);
  const [dietType, setDietType] = useState<string[]>([]);
  // ... 10+ state variables
  
  // Prefills from existing data
  useEffect(() => {
    const profile = await fetchProfile(token);
    // Extract and set form values
  }, [token]);
  
  // Business logic methods
  const handleSave = async () => { /* ... */ };
  const handleAiPicksComplete = async (payload) => { /* ... */ };
  
  return { name, setName, dietType, handleSave, ... };
}
```

### 3. Multi-View Navigation
The edit form manages two views (form ↔ AI-assist) in the application layer:
```tsx
const [view, setView] = useState<"form" | "ai-assist">("form");
```

UI just renders based on view state - no navigation logic in UI.

## Benefits

✅ **Separation of Concerns** - UI is pure presentation, business logic in application layer
✅ **View Model Pattern** - Data transformation separated from presentation
✅ **Complex State Management** - Form state properly abstracted
✅ **Testability** - Hooks can be tested independently
✅ **Reusability** - Hooks can be used by multiple components
✅ **Maintainability** - Clear responsibilities

## Module Exports

Public API (index.ts):
- ✅ UI Components: `ProfilePage`, `EditProfilePage`
- ✅ Types: `UserProfile`, `PreferenceProfile`
- ❌ Internal functions hidden (used by hooks)

## Conclusion

✅ **Profile module is correctly structured**

The profile module demonstrates excellent separation of concerns:
- Pure types and constants in model layer
- Pure API calls in infra layer
- Complex business logic in application layer (form management, data transformation, multi-view navigation)
- Pure presentation in UI layer

**No changes needed** - this module serves as a reference implementation for proper separation of concerns.
