export const buildXRecentSearchQuery = (queryTerms: string[]): string => {
  const validTerms = queryTerms.filter(term => term.trim().length > 0);

  if (validTerms.length === 0) {
    throw new Error("At least one X query term is required.");
  }

  const quotedTerms = validTerms.map(term => {
    if (term.includes(" ")) {
      return `"${term}"`;
    }
    return term;
  });

  return `(${quotedTerms.join(" OR ")}) lang:en -is:retweet`;
};

export const createXMonitorProvider = (options?: { fetchFn?: typeof fetch }) => {
  const fetchFn = options?.fetchFn ?? fetch;

  return {
    fetchRecentPosts: async (args: any) => {
      return [];
    },
  };
};
