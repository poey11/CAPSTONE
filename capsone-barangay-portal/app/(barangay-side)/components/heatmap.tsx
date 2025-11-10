"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

interface incidentProps {
  id: string;
  typeOfIncident: string;
  createdAt: string;
  areaOfIncident: string;
  status: string;
  department: string;
}

interface props {
  incidents: incidentProps[];
}

const IncidentHeatmap: React.FC<props> = ({ incidents }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const areaBoundaries = {
    "South Fairview": [
      [121.06777, 14.697256],
      [121.067999, 14.700328],
      [121.068775, 14.703442],
      [121.06953, 14.706513],
      [121.074745, 14.704994],
      [121.08189, 14.70509],
      [121.081844, 14.704635],
      [121.073607, 14.704266],
      [121.070309, 14.693365],
      [121.067649, 14.693645],
    ],
    "East Fairview": [
      [121.066738, 14.706702],
      [121.06655, 14.709568],
      [121.067562, 14.710969],
      [121.079762, 14.711202],
      [121.083206, 14.71016],
      [121.081583, 14.705229],
      [121.074733, 14.705387],
      [121.070527, 14.706777],
      [121.066751, 14.706691],
    ],
    "West Fairview": [
      [121.067584, 14.693538],
      [121.062504, 14.693147],
      [121.062477, 14.694596],
      [121.057839, 14.694402],
      [121.058045, 14.704855],
      [121.060066, 14.704836],
      [121.060002, 14.704379],
      [121.062304, 14.704149],
      [121.064473, 14.705549],
      [121.065091, 14.705173],
      [121.066751, 14.70563],
      [121.066807, 14.706362],
      [121.069242, 14.706303],
      [121.068537, 14.703449],
      [121.067921, 14.701693],
      [121.067522, 14.699888],
      [121.067486, 14.697248],
      [121.067584, 14.693538],

    ],
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current) return;

    // Compute incident weights
    const areaScores: { [area: string]: number } = {};
    incidents.forEach((incident) => {
      const area = incident.areaOfIncident;
      const weight = incident.typeOfIncident === "Major" ? 2 : 0.5;
      if (!areaScores[area]) areaScores[area] = 0;
      areaScores[area] += weight;
    });

    const maxScore = Math.max(...Object.values(areaScores), 1);

    const interpolateColor = (t: number) => {
      const r = t < 0.5 ? t * 2 * 255 : 255;
      const g = t < 0.5 ? 255 : (1 - (t - 0.5) * 2) * 255;
      const b = 0;
      return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    };

    const computedColors: { [area: string]: string } = {};
    Object.entries(areaBoundaries).forEach(([area]) => {
      const score = areaScores[area] || 0;
      const normalized = score / maxScore;
      computedColors[area] = interpolateColor(normalized);
    });

    // Initialize map (static)
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      center: [121.069322, 14.702139],
      zoom: 14,
      interactive: false,
    });

    map.current.on("load", () => {
      // Disable all interactions
      map.current?.dragPan.disable();
      map.current?.scrollZoom.disable();
      map.current?.boxZoom.disable();
      map.current?.keyboard.disable();
      map.current?.doubleClickZoom.disable();
      map.current?.touchZoomRotate.disable();

      const areaFeatures = Object.entries(areaBoundaries).map(([name, coords]) => ({
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [coords],
        },
        properties: {
          name,
          color: computedColors[name] || "#CCCCCC",
          score: areaScores[name] || 0,
        },
      }));

      map.current?.addSource("area-boundaries", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: areaFeatures,
        },
      });

      map.current?.addLayer({
        id: "area-fill",
        type: "fill",
        source: "area-boundaries",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.4,
        },
      });

      map.current?.addLayer({
        id: "area-outline",
        type: "line",
        source: "area-boundaries",
        paint: {
          "line-color": "#000000",
          "line-width": 0.5,
        },
      });

      map.current?.addLayer({
        id: "area-hover",
        type: "line",
        source: "area-boundaries",
        paint: {
          "line-color": "#000000",
          "line-width": 2,
        },
        filter: ["==", "name", ""],
      });

       
     

      map.current?.addLayer({
        id: "area-labels",
        type: "symbol",
        source: "area-boundaries",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 14,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#000",
          "text-halo-color": "#fff",
          "text-halo-width": 1,
        },
      });

      // ✅ Popup now follows the cursor closely
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -500], // <-- pushes popup upward closer to cursor
        anchor: "center",

      });

map.current?.on("mousemove", "area-fill", (e) => {
  if (!e.features?.length) return;
  const feature = e.features[0];
  const areaName = feature.properties?.name;
  const color = feature.properties?.color;
  const score = feature.properties?.score;

  popup
    .setLngLat(e.lngLat)
    .setHTML(`
      <div style="pointer-events:none;">
        <div
          style="
            font-size:13px;
            background:#ffffff;
            padding:8px 12px;
            border-radius:6px;
            box-shadow:0 1px 4px rgba(0,0,0,0.25);
            display:inline-block;
          "
        >
          <strong>${areaName}</strong><br/>
          <span style="color:${color}">●</span> Score: ${score.toFixed(2)}
          <br>
          <span>Total Cases: </span>
          <span>${
            incidents.filter(
              (incident) => incident.areaOfIncident === areaName
            ).length
          }</span>
          <br>
          <span style="display:block; font-size:11px; color:#555;">
            (Hovering to view details)
          </span>
        </div>
      </div>
    `)
    .addTo(map.current!);

  map.current?.setFilter("area-hover", ["==", "name", areaName]);
});


      map.current?.on("mouseleave", "area-fill", () => {
        popup.remove();
        map.current?.setFilter("area-hover", ["==", "name", ""]);
      });
    });

    return () => map.current?.remove();
  }, [isClient, incidents]);

  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
};

export default IncidentHeatmap;





//  <span>Total Cases Per Department: </span>
//               <br>
//               <span>${
//                 ["Lupon", "BCPC", "GAD", "VAWC"]
//                   .map((dept => {
//                     const count = incidents.filter(
//                       (incident) =>
//                         incident.areaOfIncident === areaName &&
//                         incident.department === dept
//                     ).length;
//                     return `${dept}: ${count}`;
//                   })).join(", ")
//               }</span>


// Uncomment below to add individual point markers for each coordinate in areaBoundaries
      // 9. Add individual point markers for each coordinate in areaBoundaries
    //   const allPoints = Object.entries(areaBoundaries).flatMap(([areaName, coords]) =>
    //     coords.map(([lng, lat]) => ({
    //       type: "Feature" as const,
    //       geometry: {
    //         type: "Point" as const,
    //         coordinates: [lng, lat],
    //       },
    //       properties: {
    //         area: areaName,
    //         lng,lat
    //       },
    //     }))
    //   );
      
    //   map.current?.addSource("area-points", {
    //     type: "geojson",
    //     data: {
    //       type: "FeatureCollection",
    //       features: allPoints,
    //     },
    //   });
      
    //   map.current?.addLayer({
    //   id: "area-points-layer",
    //   type: "circle",
    //   source: "area-points",
    //   paint: {
    //     "circle-radius": 4,
    //     "circle-stroke-width": 1,
    //     "circle-stroke-color": "#ffffff",

    //     // 🎨 Circle color depends on the area
    //     "circle-color": [
    //       "match",
    //       ["get", "area"], // the property to check
    //       "North Fairview", "#e63946",
    //       "South Fairview", "#457b9d",
    //       "West Fairview", "#2a9d8f",
    //       "East Fairview", "#f4a261",
    //       "Central Fairview", "#8d99ae",
    //       /* default color */ "#0000FF"
    //     ],
    //   },
    // });

    //  map.current?.addLayer({
    //     id: "area-points-labels",
    //     type: "symbol",
    //     source: "area-points",
    //     layout: {
    //       "text-field": [
    //         "format",
    //         ["to-string", ["get", "lat"]], {}, "\n",
    //         ["to-string", ["get", "lng"]], {}
    //       ],
    //       "text-size": 10,
    //       "text-offset": [0, 1.2],
    //       "text-anchor": "top",
    //     },
    //     paint: {
    //       "text-color": "#111",
    //       "text-halo-color": "#fff",
    //       "text-halo-width": 1,
    //     },
    //   });
