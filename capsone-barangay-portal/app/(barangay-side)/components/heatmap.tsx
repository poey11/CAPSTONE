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
      [121.042, 14.674], [121.046, 14.674], [121.046, 14.678], [121.042, 14.678], [121.042, 14.674]
    ],
    "East Fairview": [
      [121.046, 14.674], [121.050, 14.674], [121.050, 14.678], [121.046, 14.678], [121.046, 14.674]
    ],
    "West Fairview": [
      [121.038, 14.678], [121.044, 14.678], [121.044, 14.682], [121.038, 14.682], [121.038, 14.678]
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
      center: [121.0437, 14.678],
      zoom: 15.35,
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
