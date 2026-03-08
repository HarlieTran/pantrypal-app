# Recipes Module - Separation of Concerns

## Structure

```
recipes/
├── model/           # Data types
├── infra/           # API integration
├── application/     # Business logic hooks
├── ui/              # Pure presentation components
└── index.ts         # Public exports
```

## Layer Responsibilities

### model/ - Domain Types ✅
**Purpose**: Define data structures

**Files**:
- `recipes.types.ts`
  - `RecipeSuggestion` - Recipe suggestion with ingredient matching
  - `RecipeDetails` - Full recipe details with steps
  - `CookRecipeResult` - Result of cooking a recipe (pantry updates)

**Status**: ✅ Complete - Types properly defined

### infra/ - API Integration ✅
**Purpose**: Handle HTTP communication with backend

**Files**:
- `recipes.api.ts` - API client functions
  - `fetchRecipeSuggestions()` - Get recipe suggestions based on pantry
  - `fetchRecipeDetails()` - Get full recipe details
  - `cookRecipe()` - Cook recipe and update pantry (with dry-run option)

**Dependencies**:
- Uses shared `lib/api` client
- Imports types from `model/`

**Status**: ✅ Complete - Pure API calls

### application/ - Business Logic ✅
**Purpose**: Manage state and orchestrate business operations

**Files**:
- `useRecipeSuggestions.ts` - Recipe suggestions management
  - Loads recipe suggestions
  - Manages loading/error states
  - Provides reload functionality
  
- `useRecipeDetails.ts` - Recipe details and cooking workflow
  - Opens recipe details modal
  - Loads full recipe details
  - Manages cooking preview (dry-run)
  - Handles cooking confirmation
  - Manages modal state (open/close)
  - Provides retry functionality

**Dependencies**:
- Imports types from `model/`
- Calls functions from `infra/`
- React hooks (useState)

**Status**: ✅ Complete - All business logic extracted from UI

### ui/ - Presentation ✅
**Purpose**: Render UI based on props and callbacks

**Files**:
- `pages/RecipesPage.tsx` - Recipe suggestions page
- `components/RecipeDetailsModal.tsx` - Recipe details modal

**Dependencies**:
- Uses hooks from `application/`
- Imports types from `model/`

**Status**: ✅ Refactored - Pure presentation, no business logic

## Key Changes Made

### Before (Business Logic in UI)
```tsx
// RecipesPage.tsx
const [items, setItems] = useState([]);
const [selectedRecipe, setSelectedRecipe] = useState(null);
const [cooking, setCooking] = useState(false);

const loadSuggestions = async () => {
  const data = await fetchRecipeSuggestions(token, 12);
  setItems(data.recipes);
};

const handleCookConfirm = async () => {
  const applied = await cookRecipe(token, selectedId, { dryRun: false });
  // ... complex logic
};
```

### After (Business Logic in Application Layer)
```tsx
// application/useRecipeSuggestions.ts
export function useRecipeSuggestions(token: string) {
  const [items, setItems] = useState([]);
  // ... all state and logic
  return { items, load, ... };
}

// application/useRecipeDetails.ts
export function useRecipeDetails(token: string, suggestions) {
  // ... all modal and cooking logic
  return { open, preview, confirm, close, ... };
}

// ui/RecipesPage.tsx
const { items, load } = useRecipeSuggestions(token);
const { open, preview, confirm } = useRecipeDetails(token, items);
```

## Complex Workflow: Recipe Cooking

The `useRecipeDetails` hook manages a complex cooking workflow:

1. **Open** - Load recipe details
2. **Preview** - Dry-run to see what pantry changes would occur
3. **Confirm** - Apply changes to pantry
4. **Close** - Clean up state

This demonstrates proper separation where complex orchestration logic lives in the application layer.

## Benefits

✅ **Separation of Concerns** - UI is pure presentation, business logic in application layer
✅ **Testability** - Hooks can be tested independently of UI
✅ **Reusability** - Hooks can be used by multiple components
✅ **Maintainability** - Clear responsibilities, easy to locate code
✅ **Complex Workflows** - Multi-step cooking process properly abstracted

## Module Exports

Public API (index.ts):
- ✅ UI Components: `RecipesPage`
- ✅ Types: `RecipeSuggestion`, `RecipeDetails`, `CookRecipeResult`
- ❌ Internal API functions hidden (used by hooks)

This ensures consumers use the page component rather than building their own recipes UI.
