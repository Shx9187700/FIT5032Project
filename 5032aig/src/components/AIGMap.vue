<template>
  <div class="map-container">
    <div class="search-box">
      <input
        v-model="query"
        type="text"
        placeholder="Search any place..."
        aria-label="Search a place on map"
        @keyup.enter="searchPlace"
      />
      <button @click="searchPlace" aria-label="Search">🔍</button>
    </div>
    <button class="locate-btn" @click="locateUser" title="Go to my location">
      📍
    </button>
    <button class="reset-btn" @click="resetMap" title="Reset view">
      🔄
    </button>
    <div ref="mapContainer" class="map"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"
import mapboxgl from "mapbox-gl"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const mapContainer = ref(null)
const map = ref(null)
const query = ref("")
const marker = ref(null)
const popup = ref(null)
const defaultCenter = [145.123, -37.924]
const defaultZoom = 13

onMounted(async () => {
  await nextTick()
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: "mapbox://styles/mapbox/streets-v12",
    center: defaultCenter,
    zoom: defaultZoom,
  })

  map.value.on("load", () => {
    map.value.resize()
    console.log("✅ Map loaded successfully")
  })
})

async function searchPlace() {
  if (!query.value.trim()) return

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query.value
  )}.json?country=AU&limit=1&access_token=${mapboxgl.accessToken}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (!data.features?.length) {
      alert("No matching location found.")
      return
    }

    const place = data.features[0]
    const coords = place.geometry.coordinates
    const name = place.text
    const address = place.place_name

    if (marker.value) marker.value.remove()
    if (popup.value) popup.value.remove()

    marker.value = new mapboxgl.Marker({ color: "#3a86ff" })
      .setLngLat(coords)
      .addTo(map.value)

    map.value.flyTo({
      center: coords,
      zoom: 15,
      speed: 0.8,
      essential: true,
    })

    setTimeout(() => {
      popup.value = new mapboxgl.Popup({
        offset: [0, -25],
        anchor: "top",
        closeOnClick: false,
        className: "custom-popup",
      })
        .setLngLat(coords)
        .setHTML(`
          <div class="popup-card">
            <div class="popup-header">
              <span class="popup-icon">🏥</span>
              <h3 class="popup-title">${name}</h3>
            </div>
            <div class="popup-body">
              <p class="popup-address">${address}</p>
            </div>
          </div>
        `)
        .addTo(map.value)
    }, 700)
  } catch (err) {
    console.error("Search failed:", err)
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.")
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { longitude, latitude } = pos.coords
      if (marker.value) marker.value.remove()
      if (popup.value) popup.value.remove()
      marker.value = new mapboxgl.Marker({ color: "#2a9d8f" })
        .setLngLat([longitude, latitude])
        .addTo(map.value)
      map.value.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        speed: 0.8,
      })
    },
    (err) => {
      console.error("Location error:", err)
      alert("Unable to access your location.")
    }
  )
}

// Reset
function resetMap() {
  if (marker.value) marker.value.remove()
  if (popup.value) popup.value.remove()
  map.value.flyTo({
    center: defaultCenter,
    zoom: defaultZoom,
    speed: 0.8,
  })
}
</script>

<style scoped>
/* ==========  MAP LAYOUT ========== */
.map-container {
  position: relative;
  width: 80vw;
  height: 75vh;
  margin: 0 auto;
  border-radius: 16px;
  background: #f7faff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);

  overflow: hidden;
  isolation: isolate;
  transform: translateZ(0);
  will-change: transform;
}

.map {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background-color: #eef4fb;
}

.search-box {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: white;
  border-radius: 25px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  padding: 5px 10px;
  z-index: 20;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 1rem;
  padding: 8px 10px;
  width: 240px;
}

.search-box button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}

.locate-btn,
.reset-btn {
  position: absolute;
  right: 20px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 1.3rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  z-index: 20;
  transition: transform 0.2s;
}
.locate-btn:hover,
.reset-btn:hover {
  transform: scale(1.1);
}
.locate-btn {
  bottom: 20px;
}
.reset-btn {
  bottom: 75px;
}

/* ========== POPUP STYLE ========== */
.mapboxgl-popup.custom-popup .mapboxgl-popup-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  border: 1px solid #e0e0e0;
  padding: 0;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
  max-width: 260px;
}

.popup-card {
  font-family: "Inter", sans-serif;
}

.popup-header {
  background: linear-gradient(90deg, #3a86ff, #00b4d8);
  color: white;
  padding: 10px 14px;
  display: flex;
  align-items: center;
}

.popup-icon {
  margin-right: 8px;
  font-size: 1.2rem;
}

.popup-title {
  font-size: 1rem;
  margin: 0;
  font-weight: 600;
}

.popup-body {
  padding: 10px 14px;
  background: #ffffff;
}

.popup-address {
  margin: 0;
  color: #333;
  line-height: 1.4;
  font-size: 0.9rem;
}

.mapboxgl-popup {
  backface-visibility: hidden;
  transform: none !important;
  z-index: 30 !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
