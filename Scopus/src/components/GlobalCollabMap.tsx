import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';

interface CountryData {
  country: string;
  count: number;
}

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const manualMapping: Record<string, string> = {
  'russian federation': 'russia',
  'syrian arab republic': 'syria',
  'united states': 'united states of america',
};

const GlobalCollabMap: React.FC = () => {
  const [data, setData] = useState<CountryData[]>([]);
  const [geoNames, setGeoNames] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Fetch data from backend API (replace with your actual backend URL and port)
  useEffect(() => {
    fetch('http://localhost:5000/api/insights/countries')  // <-- Change here if needed
      .then(res => {
        if (!res.ok) throw new Error(`Network response not ok: ${res.status}`);
        return res.json();
      })
      .then(apiData => {
        console.log('API data:', apiData);
        setData(apiData);
      })
      .catch(err => {
        console.error('Failed to load API data:', err);
        setData([]);
      });
  }, []);

  // Fetch GeoJSON country names
  useEffect(() => {
    fetch(geoUrl)
      .then(res => res.json())
      .then(worldData => {
        const names = worldData.objects?.countries?.geometries
          ?.map((geo: any) => geo.properties.name)  // note 'name' lowercase here!
          .filter((name: any) => !!name)
          .map((name: string) => name.toLowerCase()) || [];
        console.log('GeoJSON country names sample:', names.slice(0, 20));
        setGeoNames(names);
      })
      .catch(err => {
        console.error('Failed to load GeoJSON:', err);
      });
  }, []);

  // Simple similarity heuristic for matching country names
  function simpleSimilarity(a: string, b: string): number {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 0;
    if (a.includes(b) || b.includes(a)) return 1;
    return Math.abs(a.length - b.length) + 1;
  }

  // Build mapping from your data countries to GeoJSON country names
  useEffect(() => {
    if (!geoNames.length || !data.length) return;

    const map: Record<string, string> = {};
    data.forEach(({ country }) => {
      const cLower = country.toLowerCase();

      // Check manual mapping first
      if (manualMapping[cLower]) {
        map[cLower] = manualMapping[cLower];
        console.log(`Manually mapped "${country}" to "${map[cLower]}"`);
        return;
      }

      // Auto match by similarity
      let bestMatch = '';
      let bestScore = Number.MAX_SAFE_INTEGER;
      for (const geoName of geoNames) {
        const score = simpleSimilarity(cLower, geoName);
        if (score < bestScore) {
          bestScore = score;
          bestMatch = geoName;
        }
      }
      map[cLower] = bestMatch;
      console.log(`Auto-mapped "${country}" to "${bestMatch}" with score ${bestScore}`);
    });

    setMapping(map);
  }, [geoNames, data]);

  // Prepare map for quick lookup by GeoJSON country name
  const dataMap = new Map<string, number>();
  data.forEach(({ country, count }) => {
    const geoName = mapping[country.toLowerCase()] || country.toLowerCase();
    dataMap.set(geoName, count);
  });

  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(['#e0f3ff', '#023858']);

  return (
    <div style={{ width: '100%', height: '700px' }}>
      <ComposableMap
        projectionConfig={{ scale: 200, center: [0, 20] }}
        style={{ width: '100%', height: '100%', border: '1px solid #ddd', borderRadius: '8px' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies, loading, error }) => {
            if (loading) return <text x={400} y={350}>Loading map data...</text>;
            if (error) return <text x={400} y={350}>Failed to load map data</text>;

            return geographies.map(geo => {
              const countryName = geo.properties.name || '';
              const count = dataMap.get(countryName.toLowerCase()) || 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={count ? colorScale(count) : '#f0f0f0'}
                  stroke="#DDD"
                  strokeWidth={0.5}
                  data-tooltip-id="map-tooltip"
                  data-tooltip-content={`${countryName} — Collaborations: ${count}`}
                  style={{
                    default: { outline: 'none' },
                    hover: {
                      fill: '#ff9933',
                      outline: 'none',
                      cursor: 'pointer',
                      strokeWidth: 1,
                      stroke: '#666',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            });
          }}
        </Geographies>
      </ComposableMap>

      <Tooltip
        id="map-tooltip"
        place="top"
        style={{
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
          zIndex: 1000,
        }}
      />
    </div>
  );
};

export default GlobalCollabMap;
