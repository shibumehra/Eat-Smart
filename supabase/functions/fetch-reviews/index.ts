const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName } = await req.json();
    if (!productName) {
      return new Response(JSON.stringify({ success: false, error: 'Product name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Searching reviews for:', productName);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${productName} review`,
        limit: 8,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl error:', data);
      return new Response(JSON.stringify({ success: false, error: 'Search failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse results into reviews with platform detection
    const reviews = (data.data || []).slice(0, 6).map((result: any) => {
      const url = result.url || '';
      let platform = 'Other';
      if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'YouTube';
      else if (url.includes('reddit.com')) platform = 'Reddit';
      else if (url.includes('amazon.')) platform = 'Amazon';
      else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'Twitter';

      // Extract a snippet from markdown
      const md = result.markdown || result.description || '';
      const snippet = md.slice(0, 200).replace(/[#\[\]()]/g, '').trim();

      return {
        title: result.title || '',
        snippet,
        platform,
        url,
        source: result.title || platform,
      };
    }).filter((r: any) => r.snippet.length > 20);

    return new Response(JSON.stringify({ success: true, reviews }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch reviews' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
