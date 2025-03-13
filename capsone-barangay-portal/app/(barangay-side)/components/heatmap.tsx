"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

const incidents = [
    { lat: 14.676, lng: 121.0437, intensity: 1 },
    { lat: 14.678, lng: 121.045, intensity: 2 },
    { lat: 14.680, lng: 121.047, intensity: 3 },
  ];

const Heatmap = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect (()=>{
        map.current = new maplibregl.Map({
            container: mapContainer.current as HTMLElement,
            style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // ✅ Try this style
            center: [121.0437, 14.676], // Barangay Fairview
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
              id: "heatmap-layer",
              type: "heatmap",
              source: "incidents",
              paint: {
                "heatmap-weight": ["get", "intensity"],
                "heatmap-intensity": 1,
                "heatmap-radius": 25,
                "heatmap-opacity": 0.8,
              },
            });
          });
      
          return () => map.current?.remove();
    }, []);
        
    


    return(
       <div ref={mapContainer} className="w-full h-[500px]"/>
    )

}

export default Heatmap;