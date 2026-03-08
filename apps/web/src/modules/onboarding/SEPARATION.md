# Onboarding Module - Separation of Concerns

## Structure

```
onboarding/
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
- `onboarding.types.ts` - Re-exports from shared-types
  - `OnboardingQuestion`
  - `OnboardingAnswerInput`

**Status**: ✅ Complete - Types properly defined

### infra/ - API Integration ✅
**Purpose**: Handle HTTP communication with backend

**Files**:
- `onboarding.api.ts` - API client functions
  - `getMe()` - Fetch user profile
  - `getOnboardingQuestions()` - Fetch questionnaire
  - `saveAnswers()` - Save questionnaire answers
  - `completeOnboarding()` - Mark onboarding complete
  - `getRecipeImages()` - Fetch recipe images for preference picker
  - `submitRecipeSelections()` - Submit recipe preferences

**Dependencies**:
- Uses shared `lib/api` client
- Imports types from `@pantrypal/shared-types`

**Status**: ✅ Complete - Pure API calls

### application/ - Business Logic ✅
**Purpose**: Manage state and orchestrate business operations

**Files**:
- `useOnboardingQuestionnaire.ts` - Questionnaire state management
  - Loads questions
  - Manages answers state
  - Handles multi-choice and text inputs
  - Submits answers and completes onboarding
  
- `useRecipePreferencePicker.ts` - Recipe preference state management
  - Loads recipe images
  - Manages selection state across multiple rounds
  - Merges selections from multiple rounds
  - Validates and submits preferences

**Dependencies**:
- Imports types from `model/` and `@pantrypal/shared-types`
- Calls functions from `infra/`
- React hooks (useState, useEffect, useMemo)

**Status**: ✅ Complete - All business logic extracted from UI

### ui/ - Presentation ✅
**Purpose**: Render UI based on props and callbacks

**Files**:
- `components/OnboardingQuestionnaire.tsx` - Questionnaire form UI
- `components/RecipePreferencePicker.tsx` - Recipe selection grid UI

**Dependencies**:
- Uses hooks from `application/`
- Imports constants from `@pantrypal/shared-types`

**Status**: ✅ Refactored - Pure presentation, no business logic

## Key Changes Made

### Before (Business Logic in UI)
```tsx
// OnboardingQuestionnaire.tsx
const [questions, setQuestions] = useState([]);
const [answers, setAnswers] = useState({});
const [loading, setLoading] = useState(true);

useEffect(() => {
  // API call in UI component
  const data = await getOnboardingQuestions();
  setQuestions(data.questions);
}, []);

const onSave = async () => {
  // Business logic in UI component
  const payload = questions.map(...).filter(...);
  await saveAnswers(token, payload);
  await completeOnboarding(token);
};
```

### After (Business Logic in Application Layer)
```tsx
// application/useOnboardingQuestionnaire.ts
export function useOnboardingQuestionnaire(token: string) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  // ... all state and logic here
  
  const submit = async () => {
    const payload = questions.map(...).filter(...);
    await saveAnswers(token, payload);
    await completeOnboarding(token);
  };
  
  return { questions, answers, submit, ... };
}

// ui/OnboardingQuestionnaire.tsx
const { questions, answers, submit } = useOnboardingQuestionnaire(token);
```

## Benefits

✅ **Separation of Concerns** - UI is pure presentation, business logic in application layer
✅ **Testability** - Hooks can be tested independently of UI
✅ **Reusability** - Hooks can be used by multiple components
✅ **Maintainability** - Clear responsibilities, easy to locate code
✅ **Type Safety** - Proper type flow from model layer

## Data Flow

```
UI Component (OnboardingQuestionnaire)
    ↓ (uses hook)
Application Hook (useOnboardingQuestionnaire)
    ↓ (calls API)
Infra API Client (onboarding.api)
    ↓ (HTTP request)
Backend
```

## Module Exports

Public API (index.ts):
- ✅ UI Components: `OnboardingQuestionnaire`, `RecipePreferencePicker`
- ✅ Essential API functions: `getMe`, `completeOnboarding`, `submitRecipeSelections`
- ❌ Internal functions hidden: `getOnboardingQuestions`, `getRecipeImages`, `saveAnswers` (used by hooks)

This ensures consumers use the hooks rather than calling API functions directly.
