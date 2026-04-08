import { useEffect } from "react";

const TABLEAU_HTML = `
<div class='tableauPlaceholder' id='viz1775621299965' style='position: relative'>
  <noscript>
    <a href='#'>
      <img alt='Player Averages' src='https://public.tableau.com/static/images/Hi/HistoricalStatsDatabaseNEWlocalCSV/PlayerAverages/1_rss.png' style='border: none' />
    </a>
  </noscript>
  <object class='tableauViz' style='display:none;'>
    <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' />
    <param name='embed_code_version' value='3' />
    <param name='site_root' value='' />
    <param name='name' value='HistoricalStatsDatabaseNEWlocalCSV/PlayerAverages' />
    <param name='tabs' value='no' />
    <param name='toolbar' value='yes' />
    <param name='static_image' value='https://public.tableau.com/static/images/Hi/HistoricalStatsDatabaseNEWlocalCSV/PlayerAverages/1.png' />
    <param name='animate_transition' value='yes' />
    <param name='display_static_image' value='yes' />
    <param name='display_spinner' value='yes' />
    <param name='display_overlay' value='yes' />
    <param name='display_count' value='yes' />
    <param name='language' value='en-GB' />
  </object>
</div>
`;

export default function StatsPage() {
  useEffect(() => {
    const existing = document.querySelector('script[src*="viz_v1.js"]');
    if (existing) existing.remove();

    const container = document.getElementById("viz1775621299965");
    if (!container) return;
    const vizObject = container.getElementsByTagName("object")[0];
    if (!vizObject) return;

    vizObject.style.width = "1300px";
    vizObject.style.height = "1027px";

    const script = document.createElement("script");
    script.src = "https://public.tableau.com/javascripts/api/viz_v1.js";
    vizObject.parentNode!.insertBefore(script, vizObject);

    return () => { script.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary/80 mb-1.5 block">
            Australian Basketball
          </span>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            NBL PLAYER<span className="text-primary"> STATS</span>
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Historical player averages database. Powered by Tableau.
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto py-6 px-4 sm:px-6 lg:px-8">
        <div dangerouslySetInnerHTML={{ __html: TABLEAU_HTML }} />
      </div>
    </div>
  );
}
