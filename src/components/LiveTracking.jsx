import React, { useState, useRef } from "react";
import Papa from "papaparse";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LiveTracking.css";

export default function LiveTracking() {
  // State for the selected year as a string.
  const [selectedYear, setSelectedYear] = useState("2023");
  // useRef to store the Leaflet map instance and marker layer group.
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Function to load and render marine incidents markers.
  const loadMarineIncidents = () => {
    fetch("/incidents (1).csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.statusText);
        }
        return response.text();
      })
      .then((csvText) => {
        // Parse CSV into objects.
        const results = Papa.parse(csvText, { header: true });
        let data = results.data;

        // Filter out rows missing essential fields.
        data = data.filter((row) => row.lat && row.lon && row.open_date);

        // Filter incidents by the selected year.
        data = data.filter((row) => {
          const openDate = new Date(row.open_date); // expects "yyyy-mm-dd"
          return openDate.getFullYear().toString() === selectedYear.trim();
        });

        if (data.length === 0) {
          alert(`No marine incidents found for ${selectedYear}.`);
          return;
        }

        // Calculate map center (average of latitudes and longitudes).
        let sumLat = 0,
          sumLon = 0,
          count = 0;
        data.forEach((row) => {
          const lat = parseFloat(row.lat);
          const lon = parseFloat(row.lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            sumLat += lat;
            sumLon += lon;
            count++;
          }
        });
        const center = count > 0 ? [sumLat / count, sumLon / count] : [0, 0];

        // Initialize or update the map.
        if (!mapRef.current) {
          mapRef.current = L.map("map").setView(center, 5);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(mapRef.current);
          markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
        } else {
          mapRef.current.setView(center, 5);
          markersLayerRef.current.clearLayers();
        }

        // Inject custom CSS for blinking markers if not already present.
        if (!document.getElementById("blinking-marker-style")) {
          const css = `
            .blinking-marker {
              width: 12px;
              height: 12px;
              background-color: red;
              border-radius: 50%;
              box-shadow: 0 0 15px red;
              animation: blink 1s infinite;
            }
            @keyframes blink {
              0%, 100% { opacity: 1; box-shadow: 0 0 15px red; }
              50% { opacity: 0.5; box-shadow: 0 0 5px red; }
            }
          `;
          const style = document.createElement("style");
          style.id = "blinking-marker-style";
          style.innerHTML = css;
          document.head.appendChild(style);
        }

        // Add markers for each incident.
        data.forEach((row) => {
          const lat = parseFloat(row.lat);
          const lon = parseFloat(row.lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            let popupContent = "";
            for (let key in row) {
              if (row.hasOwnProperty(key) && key !== "lat" && key !== "lon") {
                popupContent += `<b>${key}:</b> ${row[key]}<br>`;
              }
            }
            L.marker([lat, lon], {
              icon: L.divIcon({
                className: "blinking-marker",
                html: `<div class="blinking-marker"></div>`,
                iconSize: [12, 12],
              }),
            })
              .bindPopup(popupContent)
              .addTo(markersLayerRef.current);
          }
        });
      })
      .catch((error) => {
        console.error("Error loading marine incidents:", error);
        alert("Failed to load marine incidents data.");
      });
  };

  // Function to load and render live coral markers.
  const loadLiveCoral = () => {
    fetch("/coral.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.statusText);
        }
        return response.text();
      })
      .then((csvText) => {
        const results = Papa.parse(csvText, { header: true });
        let data = results.data;

        // Filter out rows missing essential fields.
        data = data.filter((row) => row.lat && row.lon && row.open_date);

        // Filter coral incidents by selected year.
        data = data.filter((row) => {
          const openDate = new Date(row.open_date);
          return openDate.getFullYear().toString() === selectedYear.trim();
        });

        if (data.length === 0) {
          alert(`No coral incidents found for ${selectedYear}.`);
          return;
        }

        // Calculate map center (average of latitudes and longitudes).
        let sumLat = 0,
          sumLon = 0,
          count = 0;
        data.forEach((row) => {
          const lat = parseFloat(row.lat);
          const lon = parseFloat(row.lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            sumLat += lat;
            sumLon += lon;
            count++;
          }
        });
        const center = count > 0 ? [sumLat / count, sumLon / count] : [0, 0];

        // Initialize or update the map.
        if (!mapRef.current) {
          mapRef.current = L.map("map").setView(center, 5);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(mapRef.current);
          markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
        } else {
          mapRef.current.setView(center, 5);
          markersLayerRef.current.clearLayers();
        }

        // Inject custom CSS for coral markers if not already injected.
        if (!document.getElementById("coral-marker-style")) {
          const css = `
            .coral-marker {
              width: 12px;
              height: 12px;
              background-color: blue;
              border-radius: 50%;
              box-shadow: 0 0 15px blue;
              animation: blink 1s infinite;
            }
            @keyframes blink {
              0%, 100% { opacity: 1; box-shadow: 0 0 15px blue; }
              50% { opacity: 0.5; box-shadow: 0 0 5px blue; }
            }
          `;
          const style = document.createElement("style");
          style.id = "coral-marker-style";
          style.innerHTML = css;
          document.head.appendChild(style);
        }

        // Add markers for each coral incident.
        data.forEach((row) => {
          const lat = parseFloat(row.lat);
          const lon = parseFloat(row.lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            let popupContent = "";
            for (let key in row) {
              if (row.hasOwnProperty(key) && key !== "lat" && key !== "lon") {
                popupContent += `<b>${key}:</b> ${row[key]}<br>`;
              }
            }
            L.marker([lat, lon], {
              icon: L.divIcon({
                className: "coral-marker",
                html: `<div class="coral-marker"></div>`,
                iconSize: [12, 12],
              }),
            })
              .bindPopup(popupContent)
              .addTo(markersLayerRef.current);
          }
        });
      })
      .catch((error) => {
        console.error("Error loading coral incidents:", error);
        alert("Failed to load coral incidents data.");
      });
  };

  return (
    <div className="container">
      <h1>Live Tracking</h1>

      {/* Year selection input */}
      <div className="input-group">
        <label htmlFor="yearSelect">Enter Year:</label>
        <input
          type="number"
          id="yearSelect"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          placeholder="e.g. 2025"
        />
      </div>

      {/* Buttons to load the incidents or coral map */}
      <div className="button-group">
        <button onClick={loadMarineIncidents}>Load Incidents Map</button>
        
      </div>

      {/* Map container */}
      <div id="map"></div>
    </div>
  );
}
