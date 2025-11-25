function populateSources() {
    const sourcesList = document.getElementById('sources-list');
    if (!sourcesList) return;
    const sources = [
        {
            citation: 'American Wind Energy Association. "Wind Energy Facts at a Glance." AWEA.org, American Wind Energy Association, www.awea.org/wind-101/basics-of-wind-energy.',
            url: 'https://www.awea.org/wind-101/basics-of-wind-energy',
            description: 'Used for: Land use estimates, transport costs, and noise levels.',
            type: 'Industry Data',
        },
        {
            citation: 'Hardin, Garrett. "The Tragedy of the Commons." Science, vol. 162, no. 3859 (1968): 1243–1248.',
            url: null,
            description: 'Used for: Theoretical framework on resource distribution and community impacts.',
            type: 'Academic Source',
        },
        {
            citation: 'Howe, Cymene. Ecologics: Wind and Power in the Anthropocene. Duke University Press, 2019.',
            url: null,
            description: 'Used for: Understanding social and environmental impacts of wind energy projects.',
            type: 'Academic Source',
        },
        {
            citation: 'Lennon, M. "Introduction: A Microgrid on the Margins." In Subjects of the Sun, Duke University Press (2025), 1–36.',
            url: null,
            description: 'Used for: Visual economy and inequality in renewable energy representations.',
            type: 'Academic Source',
        },
        {
            citation: 'National Renewable Energy Laboratory. "Texas High Resolution Wind Resource Dataset." Data.gov, U.S. Department of Energy, catalog.data.gov/dataset/texas-high-resolution-wind-resource.',
            url: 'https://catalog.data.gov/dataset/texas-high-resolution-wind-resource',
            description: 'Used for: Wind speed and capacity factor calculations.',
            type: 'Data Source',
        },
        {
            citation: 'U.S. Energy Information Administration. "Electricity Generation Emissions." EIA.gov, U.S. Department of Energy, www.eia.gov/tools/faqs/faq.php?id=74&t=11.',
            url: 'https://www.eia.gov/tools/faqs/faq.php?id=74&t=11',
            description: 'Used for: CO₂ emissions calculation (0.4 kg per kWh).',
            type: 'Government Data',
        },
        {
            citation: 'U.S. Energy Information Administration. "Levelized Costs of New Generation Resources." Annual Energy Outlook, U.S. Department of Energy, www.eia.gov/outlooks/aeo.',
            url: 'https://www.eia.gov/outlooks/aeo',
            description: 'Used for: Installation costs, electricity prices, operating costs, and solar/hydroelectric cost comparisons.',
            type: 'Economic Data',
        },
        {
            citation: 'U.S. Environmental Protection Agency. "Greenhouse Gas Emissions from Transportation." EPA.gov, U.S. Environmental Protection Agency, www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle.',
            url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
            description: 'Used for: Car emissions calculation (4.6 tons CO₂ per year).',
            type: 'Government Data',
        },
        {
            citation: 'U.S. Geological Survey and U.S. Fish and Wildlife Service. "Wind Energy and Wildlife Interactions." USGS.gov, U.S. Geological Survey, www.usgs.gov/faqs/can-wind-turbines-harm-wildlife.',
            url: 'https://www.usgs.gov/faqs/can-wind-turbines-harm-wildlife',
            description: 'Used for: Wildlife impact assessment.',
            type: 'Government Data',
        },
    ];
    sources.forEach((source, index) => {
        const card = document.createElement('div');
        card.className = 'card source-item animate-fade-up';
        card.style.animationDelay = `${index * 0.05}s`;
        const citationHTML = source.url 
            ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.875rem; color: hsl(var(--primary)); margin-bottom: 0.5rem; line-height: 1.6; font-style: italic; text-decoration: none; display: block; transition: opacity 0.2s ease; cursor: pointer;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                ${source.citation}
              </a>`
            : `<p style="font-size: 0.875rem; color: hsl(var(--foreground)); margin-bottom: 0.5rem; line-height: 1.6; font-style: italic;">
                ${source.citation}
              </p>`;
        card.innerHTML = `
            <div style="display: flex; align-items: start; gap: 1rem;">
                <div style="width: 4px; height: 40px; background-color: hsl(var(--primary)); border-radius: 2px; flex-shrink: 0; margin-top: 0.25rem;"></div>
                <div style="flex: 1; min-width: 0;">
                    ${citationHTML}
                    <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin-bottom: 0.5rem; line-height: 1.6;">
                        ${source.description}
                    </p>
                    <span class="source-badge">${source.type}</span>
                </div>
            </div>
        `;
        sourcesList.appendChild(card);
    });
}
document.addEventListener('DOMContentLoaded', function() {
    populateSources();
});