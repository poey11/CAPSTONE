"use client"; // Ensures it's a Client Component

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

interface incidentProps{
  id: string;
  typeOfIncident: string;
  createdAt: string;
  areaOfIncident: string;
  status: string;
}

interface props {
  incidents: incidentProps[];
}

const IncidentHeatmap:React.FC<props> = ({incidents}) => {
  console.log("Incident Heatmap Component Rendered: ", incidents);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false); // Ensures client-side rendering

  // Define area boundaries (polygon coordinates for each area)
  const areaBoundaries = {
    "South Fairview": [
      [121.067584, 14.693538], [121.067770, 14.697256], 
      [121.067999, 14.700328], [121.068775,14.703442], 
      [121.069530, 14.706513],  [121.074745, 14.704994],
      [121.081890, 14.70509], 
      [121.081844, 14.704635], [121.073607, 14.704266],
      [121.070309,14.693365],  [121.067649, 14.693645]
    ],
    "East Fairview": [
      [121.066738,14.706702], [121.066550,14.709568],
      [121.067562,14.710969], [121.079762,14.711202],
      [121.083206,14.710160],[121.081583,14.705229],
      [121.074733,14.705387],[121.070527,14.706777], 
      [121.066751,14.706691],
    ],
    "West Fairview": [
      [121.066919,14.693387],[121.062504,14.693147],
      [121.062477,14.694596],[121.057839,14.694402],
      [121.058045,14.704855],[121.060066,14.704836],
      [121.060002,14.704379],[121.062304,14.704149],
      [121.064473,14.705549],[121.065091,14.705173],
      [121.066751,14.705630],[121.066807,14.706362],
      [121.069242,14.706303],[121.068537,14.703449],
      [121.067921,14.701693],[121.067522,14.699888],
      [121.067486,14.697248]
    ],
  };


  useEffect(() => {
    setIsClient(true); // Mark component as client-side
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current) return;

    // 1. Group incidents by area with severity weight
    const areaScores: { [area: string]: number } = {};
    incidents.forEach((incident) => {
      const area = incident.areaOfIncident;
      const weight = incident.typeOfIncident === "Major" ? 2 : 1;
      if (!areaScores[area]) areaScores[area] = 0;
      areaScores[area] += weight;
    });

    // 2. Find max score to normalize
    const maxScore = Math.max(...Object.values(areaScores), 1); // Avoid div by 0

    console.log("Area Scores: ", areaScores);
    // 3. Helper: interpolate green → yellow → red
    const interpolateColor = (t: number) => {
      const r = t < 0.5 ? (t * 2) * 255 : 255;
      const g = t < 0.5 ? 255 : (1 - (t - 0.5) * 2) * 255;
      const b = 0;
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    };

    // 4. Compute areaColors based on normalized scores
    const computedColors: { [area: string]: string } = {};
    Object.entries(areaBoundaries).forEach(([area]) => {
      const score = areaScores[area] || 0;
      const normalized = score / maxScore;
      computedColors[area] = interpolateColor(normalized);
    });

    console.log("Computed Colors: ", computedColors);
    // 5. Init map
    map.current = new maplibregl.Map({
      container: mapContainer.current as HTMLElement,
      style: "https://tiles.stadiamaps.com/styles/osm_bright.json",
      center: [121.069322, 14.702139],
      zoom: 14,
      interactive: false,
    });

    map.current.on("load", () => {
      // 6. Build GeoJSON with dynamic color
      const areaFeatures = Object.entries(areaBoundaries).map(([name, coords]) => ({
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [coords],
        },
        properties: {
          name,
          color: computedColors[name] || "#CCCCCC", // fallback color
        },
      }));

      map.current?.addSource("area-boundaries", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: areaFeatures,
        },
      });

      // 7. Fill layer
      map.current?.addLayer({
        id: "area-fill",
        type: "fill",
        source: "area-boundaries",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.4,
        },
      });

      // 8. Labels
      map.current?.addLayer({
        id: "area-labels",
        type: "symbol",
        source: "area-boundaries",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 14,
          "text-anchor": "center",
          "text-justify": "center",
        },
        paint: {
          "text-color": "#000",
          "text-halo-color": "#fff",
          "text-halo-width": 1,
        },
      });
      // Uncomment below to add individual point markers for each coordinate in areaBoundaries
      // // 9. Add individual point markers for each coordinate in areaBoundaries
      // const allPoints = Object.entries(areaBoundaries).flatMap(([areaName, coords]) =>
      //   coords.map(([lng, lat]) => ({
      //     type: "Feature" as const,
      //     geometry: {
      //       type: "Point" as const,
      //       coordinates: [lng, lat],
      //     },
      //     properties: {
      //       area: areaName,
      //       lng,lat
      //     },
      //   }))
      // );
      
      // map.current?.addSource("area-points", {
      //   type: "geojson",
      //   data: {
      //     type: "FeatureCollection",
      //     features: allPoints,
      //   },
      // });
      
      // map.current?.addLayer({
      //   id: "area-points-layer",
      //   type: "circle",
      //   source: "area-points",
      //   paint: {
      //     "circle-radius": 4,
      //     "circle-color": "#0000FF",
      //     "circle-stroke-width": 1,
      //     "circle-stroke-color": "#ffffff",
      //   },
      // });
      
      // map.current?.addLayer({
      //   id: "area-points-labels",
      //   type: "symbol",
      //   source: "area-points",
      //   layout: {
      //     "text-field": [
      //       "format",
      //       ["to-string", ["get", "lat"]], {}, "\n",
      //       ["to-string", ["get", "lng"]], {}
      //     ],
      //     "text-size": 10,
      //     "text-offset": [0, 1.2],
      //     "text-anchor": "top",
      //   },
      //   paint: {
      //     "text-color": "#111",
      //     "text-halo-color": "#fff",
      //     "text-halo-width": 1,
      //   },
      // });



      
      // Optional: Add borders for each area
      map.current?.addLayer({
        id: "area-outline",
        type: "line",
        source: "area-boundaries",
        paint: {
          "line-color": "#000000",
          "line-width": 0.5,
        },
      });
    });

    

    return () => map.current?.remove();
  }, [isClient, incidents]);


  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
};


export default IncidentHeatmap;
