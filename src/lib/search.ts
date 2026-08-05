const MAX_SEARCH_LENGTH = 80;

export const sanitizeSearchTerm = (value: string) => {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s@.'+_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
};

export const getSearchTerms = (value: string) => {
  return sanitizeSearchTerm(value)
    .split(" ")
    .filter((term) => term.length >= 2);
};
