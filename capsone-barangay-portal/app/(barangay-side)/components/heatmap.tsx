"use client"; // Ensures it's a Client Component

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

const incidents = [
    { lat: 14.676, lng: 121.0437, intensity: 1 },
    { lat: 14.678, lng: 121.045, intensity: 2 },
    { lat: 14.680, lng: 121.047, intensity: 3 },
];

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
            properties: { intensity: incident.intensity },
          })),
        },
      });

      map.current?.addLayer({
        id: "categorical-heatmap-layer",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": 10,
          "circle-opacity": 0.7,
          "circle-color": [
            "case",
            ["==", ["get", "intensity"], 3], "#FF0000", // Red for highest intensity
            ["==", ["get", "intensity"], 2], "#FFFF00", // Yellow for medium intensity
            "#00FF00" // Green for lowest intensity
          ],
        },
      });
    });

    return () => map.current?.remove();
  }, [isClient]);

  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
};

export default IncidentHeatmap;
