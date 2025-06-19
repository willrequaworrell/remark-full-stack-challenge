export async function searchWebForTrackDetails(
    songTitle: string,
    artistName?: string
  ): Promise<
    | { results: { snippet: string; link: string }[] }
    | { error: string; suggestion: string }
  > {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;
    if (!apiKey || !cx) {
      return { error: 'Search API key or CX missing', suggestion: 'Check configuration' };
    }
  
    const query = `${songTitle}${artistName ? ` by ${artistName}` : ''} BPM key`;
    const url   = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;
    const res   = await fetch(url);
    if (!res.ok) {
      return { error: `Web search failed (${res.status})`, suggestion: 'Try again later' };
    }
  
    const data = await res.json();
    const items = data.items?.slice(0, 5).map((item: any) => ({
      snippet: item.snippet,
      link:    item.link
    }));
    if (!items || items.length === 0) {
      return { error: 'No results found', suggestion: 'Refine the track title or artist name' };
    }
  
    return { results: items };
  }
  