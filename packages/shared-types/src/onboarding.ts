export type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "FREE_TEXT";

export type OnboardingQuestionOption = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type OnboardingQuestion = {
  id: string;
  key: string;
  label: string;
  type: QuestionType;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  options: OnboardingQuestionOption[];
};

export type OnboardingAnswerInput = {
  questionKey: string;
  optionValues?: string[];
  answerText?: string;
};
