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
  // Assign a color to each area 
  const areaColors: { [key: string]: string } = {
    "South Fairview": "#0000FF", // blue
    "East Fairview": "#FFA500",  // orage 
    "West Fairview": "#00FF00", // green
  };


  useEffect(() => {
    setIsClient(true); // Mark component as client-side
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current as HTMLElement,
      style: "https://tiles.stadiamaps.com/styles/osm_bright.json",

      center: [121.0437, 14.678],
      zoom: 15.35,
      interactive: false,
    });

    map.current.on("load", () => {
    // Convert area boundaries to GeoJSON features
    const areaFeatures = Object.entries(areaBoundaries).map(([name, coords]) => ({
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [coords], // Wrap in array (GeoJSON format)
      },
      properties: {
        name,
        color: areaColors[name],
      },
    }));
  
    // Add GeoJSON source
    map.current?.addSource("area-boundaries", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: areaFeatures,
      },
    });

    // Add fill layer to show colored areas
    map.current?.addLayer({
      id: "area-fill",
      type: "fill",
      source: "area-boundaries",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.3,
      },
    });

    // 🏷️ Add symbol (text label) layer
    map.current?.addLayer({
      id: "area-labels",
      type: "symbol",
      source: "area-boundaries",
      layout: {
        "text-field": ["get", "name"], // Get area name from properties
        "text-size": 14,
        "text-anchor": "center",
        "text-justify": "center",
      },
      paint: {
        "text-color": "#000000",       // Black text
        "text-halo-color": "#ffffff",  // White outline for contrast
        "text-halo-width": 1,
      },
    });

  });


    return () => map.current?.remove();
  }, [isClient]); // Ensure it only runs on client

  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
};


export default IncidentHeatmap;
