/** One result item from Google Custom Search JSON API */
export interface SearchResultItem {
    // Only the fields we care about below are required; others are optional
    snippet: string;
    link: string;
    // Other available fields you can include if needed:
    kind?: string;
    title?: string;
    htmlTitle?: string;
    displayLink?: string;
    htmlSnippet?: string;
    formattedUrl?: string;
    htmlFormattedUrl?: string;
    pagemap?: Record<string, any>;
  }
  