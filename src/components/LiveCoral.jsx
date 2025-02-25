import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LiveCoral.css";

export default function LiveCoral() {
  const mapRef = useRef(null);
  const layerControlRef = useRef(null);

  // Helper function to create a DivIcon marker for each feature.
  // If alert = 4, it shows a blinking red marker; otherwise, it is color-coded by alert level.
  function createAlertMarker(feature, latlng) {
    const alertLevel = feature.properties?.alert;

    // Set the marker color based on the alert level.
    let color = "green"; // default (alert = 1)
    if (alertLevel === 2) color = "yellow";
    if (alertLevel === 3) color = "orange";

    let styleString = `
      width:12px;
      height:12px;
      border-radius:50%;
      background-color:${color};
    `;

    // If alert = 4, use red with a blinking animation.
    if (alertLevel === 4) {
      styleString = `
        width:12px;
        height:12px;
        border-radius:50%;
        background-color:red;
        animation: blinkRed 1s infinite;
      `;
    }

    // Create a DivIcon with the inline style.
    const iconHtml = `<div style="${styleString}"></div>`;
    const divIcon = L.divIcon({
      html: iconHtml,
      iconSize: [12, 12],
      className: "", // no extra CSS class
    });

    // Return a marker with the custom divIcon.
    return L.marker(latlng, { icon: divIcon });
  }

  // Loads two GeoJSON layers (layer 1 and layer 0).
  const loadLiveCoral = () => {
    Promise.all([
      fetch("/coral_reef_stations_layer_1.geojson").then((res) => res.json()),
      fetch("/coral_reef_stations_layer_0.geojson").then((res) => res.json()),
    ])
      .then(([geojson1, geojson2]) => {
        // If the map is not yet created, initialize it.
        if (!mapRef.current) {
          mapRef.current = L.map("map").setView([20, 0], 2);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(mapRef.current);
        } else {
          // Remove old coral layers if reloading.
          mapRef.current.eachLayer((layer) => {
            if (
              layer.options &&
              (layer.options.layerName === "Coral Layer 1" ||
                layer.options.layerName === "Coral Layer 0")
            ) {
              mapRef.current.removeLayer(layer);
            }
          });
          if (layerControlRef.current) {
            layerControlRef.current.remove();
          }
        }

        // Create GeoJSON layer 1.
        const coralLayer1 = L.geoJSON(geojson1, {
          pointToLayer: (feature, latlng) => createAlertMarker(feature, latlng),
          onEachFeature: (feature, layer) => {
            let popupContent = "";
            for (let key in feature.properties) {
              popupContent += `<b>${key}:</b> ${feature.properties[key]}<br>`;
            }
            layer.bindPopup(popupContent);
          },
          layerName: "Coral Layer 1",
        });
        coralLayer1.options.layerName = "Coral Layer 1";

        // Create GeoJSON layer 0.
        const coralLayer0 = L.geoJSON(geojson2, {
          pointToLayer: (feature, latlng) => createAlertMarker(feature, latlng),
          onEachFeature: (feature, layer) => {
            let popupContent = "";
            for (let key in feature.properties) {
              popupContent += `<b>${key}:</b> ${feature.properties[key]}<br>`;
            }
            layer.bindPopup(popupContent);
          },
          layerName: "Coral Layer 0",
        });
        coralLayer0.options.layerName = "Coral Layer 0";

        // Add both layers to the map.
        coralLayer1.addTo(mapRef.current);
        coralLayer0.addTo(mapRef.current);

        // Add a layer control to toggle the coral layers.
        layerControlRef.current = L.control
          .layers(
            {},
            {
              "Coral Reef Stations Layer 1": coralLayer1,
              "Coral Reef Stations Layer 0": coralLayer0,
            },
            { collapsed: false }
          )
          .addTo(mapRef.current);

        // Fit the map bounds to the features.
        const group = L.featureGroup([coralLayer1, coralLayer0]);
        mapRef.current.fitBounds(group.getBounds());
      })
      .catch((error) => {
        console.error("Error loading coral geojson layers:", error);
        alert("Failed to load coral geojson data.");
      });
  };

  // Load coral layers on mount.
  useEffect(() => {
    loadLiveCoral();
  }, []);

  return (
    <div className="container">
      <h1>Live Coral Map (Alert Levels)</h1>
      <div className="button-group">
        <button onClick={loadLiveCoral}>Reload Coral Layers</button>
      </div>
      <div id="map"></div>
      {/* Keyframe animation for blinking red markers */}
      <style>{`
        @keyframes blinkRed {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 8px red;
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 2px red;
          }
        }
      `}</style>
    </div>
  );
}
