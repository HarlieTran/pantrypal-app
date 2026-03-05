import type { UserProfile } from "../model/profile.types";

function matchesQuestion(
  question: { key: string; label: string },
  keys: string[],
  labelIncludes: string[],
) {
  const key = question.key.toLowerCase();
  const label = question.label.toLowerCase();
  return keys.some((k) => key === k) || labelIncludes.some((term) => label.includes(term));
}

export function buildProfileViewModel(profile: UserProfile | null) {
  const pref = profile?.preferenceProfile;

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const answers = profile?.answers ?? [];
  const allergyAnswers = answers
    .filter((a) => matchesQuestion(a.question, ["allergies"], ["allerg"]) && a.option)
    .map((a) => a.option!.label);
  const dietAnswers = answers
    .filter((a) => matchesQuestion(a.question, ["diet"], ["diet"]) && a.option)
    .map((a) => a.option!.label);
  const dislikedText = answers.find((a) => matchesQuestion(a.question, ["disliked_ingredients"], ["disliked"]))?.answerText;
  const dietNotesText = answers.find((a) => matchesQuestion(a.question, ["diet_notes"], ["diet notes"]))?.answerText;
  const allergiesOther = answers.find((a) => matchesQuestion(a.question, ["allergies_other"], ["other allerg"]))?.answerText;

  return {
    pref,
    memberSince,
    allergyAnswers,
    dietAnswers,
    dislikedText,
    dietNotesText,
    allergiesOther,
  };
}
