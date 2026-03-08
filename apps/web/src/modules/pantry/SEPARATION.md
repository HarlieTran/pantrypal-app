# Pantry Module - Separation of Concerns

## Structure

```
pantry/
├── model/           # Data types and constants
├── infra/           # API integration
├── application/     # Business logic hooks
├── ui/              # Pure presentation components
└── index.ts         # Public exports
```

## Layer Responsibilities

### model/ - Domain Types ✅
**Purpose**: Define data structures and constants

**Files**:
- `pantry.types.ts`
  - `PantryItem` - Pantry item with expiry tracking
  - `PantryMeta` - Pantry metadata
  - `ParsedIngredient` - Parsed ingredient from image
  - `ExpiryStatus` - Expiry status enum
  - `CATEGORY_EMOJI` - Category emoji mapping
  - `UNIT_OPTIONS` - Available units

**Status**: ✅ Complete - Types and constants properly defined

### infra/ - API Integration ✅
**Purpose**: Handle HTTP communication with backend

**Files**:
- `pantry.api.ts` - API client functions
  - `fetchPantry()` - Get all pantry items
  - `addPantryItem()` - Add single item
  - `addPantryItemsBulk()` - Add multiple items
  - `updatePantryItem()` - Update item
  - `deletePantryItem()` - Delete item
  - `getPantryUploadUrl()` - Get S3 upload URL
  - `parseImageForIngredients()` - Parse image for ingredients

**Dependencies**:
- Uses shared `lib/api` client
- Imports types from `model/`

**Status**: ✅ Complete - Pure API calls

### application/ - Business Logic ✅
**Purpose**: Manage state and orchestrate business operations

**Files**:
- `usePantry.ts` - Pantry state management
  - Loads pantry items
  - Manages CRUD operations
  - Calculates expiry counts
  - Handles optimistic updates
  
- `useImageUploadParser.ts` - Image upload and parsing workflow
  - Manages multi-step upload flow (pick → preview → process → review → save)
  - Handles image resizing
  - Uploads to S3
  - Parses ingredients with AI
  - Manages review/edit state
  - Validates and submits

**Dependencies**:
- Imports types from `model/`
- Calls functions from `infra/`
- React hooks (useState, useEffect, useCallback)

**Status**: ✅ Complete - All business logic extracted from UI

### ui/ - Presentation ✅
**Purpose**: Render UI based on props and callbacks

**Files**:
- `pages/PantryPage.tsx` - Main pantry page
- `components/PantryItemList.tsx` - Item list display
- `components/AddItemModal.tsx` - Add item form
- `components/ImageUploadParser.tsx` - Image upload wizard UI

**Dependencies**:
- Uses hooks from `application/`
- Imports types and constants from `model/`

**Status**: ✅ Refactored - Pure presentation, no business logic

## Key Changes Made

### Before (Business Logic in UI)
```tsx
// PantryPage.tsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const data = await fetchPantry(token);
  setItems(data.items);
}, [token]);

const handleDelete = async (itemId) => {
  await deletePantryItem(token, itemId);
  setItems(prev => prev.filter(i => i.itemId !== itemId));
};
```

### After (Business Logic in Application Layer)
```tsx
// application/usePantry.ts
export function usePantry(token: string) {
  const [items, setItems] = useState([]);
  // ... all state and logic
  
  const remove = async (itemId: string) => {
    await deletePantryItem(token, itemId);
    setItems(prev => prev.filter(i => i.itemId !== itemId));
  };
  
  return { items, remove, ... };
}

// ui/PantryPage.tsx
const { items, remove } = usePantry(token);
```

## Complex Business Logic: Image Upload Parser

The `useImageUploadParser` hook manages a complex multi-step workflow:

1. **Pick** - File selection
2. **Preview** - Show selected image
3. **Processing** - Resize → Upload to S3 → Parse with AI
4. **Review** - Edit parsed ingredients
5. **Saving** - Submit to backend

This demonstrates proper separation where complex orchestration logic lives in the application layer, not the UI.

## Benefits

✅ **Separation of Concerns** - UI is pure presentation, business logic in application layer
✅ **Testability** - Hooks can be tested independently of UI
✅ **Reusability** - Hooks can be used by multiple components
✅ **Maintainability** - Clear responsibilities, easy to locate code
✅ **Complex Workflows** - Multi-step processes properly abstracted

## Module Exports

Public API (index.ts):
- ✅ UI Components: `PantryPage`
- ✅ Types: `PantryItem`, `PantryMeta`, `ParsedIngredient`
- ❌ Internal API functions hidden (used by hooks)

This ensures consumers use the page component rather than building their own pantry UI.
