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
  { lat: 14.680, lng: 121.047, area: "West Fairview" },
  { lat: 14.681, lng: 121.048, area: "West Fairview" },
  { lat: 14.682, lng: 121.049, area: "West Fairview" },
];

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
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [121.0437, 14.676],
      zoom: 14,
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
          "circle-radius": 10,
          "circle-opacity": 0.9,
          "circle-color": ["get", "color"],
        },
      });
    });

    return () => map.current?.remove();
  }, [isClient]);

  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
};

export default IncidentHeatmap;
  
  // The heatmap component uses the  maplibre-gl  library to create a heatmap of incidents in a barangay. The component creates a map centered on a specific location and adds a source and layer to display the incidents as colored circles. The color of the circles is determined by the area of the incident, with the highest incident area shown in red, the second-highest in yellow, and the lowest in green. The component uses a list of incidents with latitude, longitude, and area information to generate the heatmap. 
  // The component uses the  useRef  and  useState  hooks to manage the map container, map instance, and client state. It also uses the  useEffect  hook to initialize the map when the component is mounted and remove the map when the component is unmounted. 
  // Overall, the heatmap component provides a visual representation of incidents in a barangay, allowing users to quickly identify areas with higher incident rates. 
  // 3.3.2. IncidentList Component 
  // The IncidentList component displays a list of incidents in a barangay. The component receives a list of incidents as props and renders each incident as a list item. The component also includes a button to view more details about each incident.