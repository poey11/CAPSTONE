"use client"; // Ensures it's a Client Component

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const incidents = [
  { lat: 14.676, lng: 121.0437, area: "South Fairview" },
  { lat: 14.675, lng: 121.044, area: "South Fairview" },
  { lat: 14.686, lng: 121.0437, area: "South Fairview" },
  { lat: 14.695, lng: 121.044, area: "South Fairview" },
  { lat: 14.706, lng: 121.0437, area: "South Fairview" },
  { lat: 14.715, lng: 121.044, area: "South Fairview" },
  { lat: 14.678, lng: 121.045, area: "East Fairview" },
];

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

// Count incidents per area
const areaCounts = incidents.reduce((acc: { [key: string]: number }, incident) => {
  acc[incident.area] = (acc[incident.area] || 0) + 1;
  return acc;
}, {});

// Sort areas by incident count (highest first)
const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);

// Assign colors based on ranking
const areaColors = {
  [sortedAreas[0]?.[0]]: "#FF0000", // Highest incident area → Red
  [sortedAreas[1]?.[0]]: "#FFFF00", // Second highest → Yellow
  [sortedAreas[2]?.[0]]: "#00FF00", // Lowest → Green
};

const IncidentHeatmap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current as HTMLElement,
      style: "https://tiles.stadiamaps.com/styles/osm_bright.json",
      center: [121.0437, 14.678],
      zoom: 13, // More noticeable zoom-out
      minZoom: 12,
      maxBounds: [
        [121.035, 14.670], // Southwest corner
        [121.055, 14.685]  // Northeast corner
      ]
    });
    
  

    map.current.on("load", () => {
      map.current?.addSource("incidents", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: incidents.map((incident) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [incident.lng, incident.lat],
            },
            properties: { area: incident.area, color: areaColors[incident.area] || "#00FF00" },
          })),
        },
      });

      map.current?.addLayer({
        id: "area-intensity-points",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": 6,
          "circle-opacity": 0.9,
          "circle-color": ["get", "color"],
        },
      });

      // Add area boundaries as a layer
      map.current?.addSource("area-boundaries", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: Object.entries(areaBoundaries).map(([area, coordinates]) => ({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [coordinates],
            },
            properties: { name: area, color: areaColors[area] || "#00FF00" },
          })),
        },
      });

      map.current?.addLayer({
        id: "area-boundary-layer",
        type: "fill",
        source: "area-boundaries",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.2,
        },
      });
    });

    return () => map.current?.remove();
  }, [isClient]);

  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
};

export default IncidentHeatmap;
