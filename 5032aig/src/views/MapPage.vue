<template>
  <div class="map-page" role="main">
    <div class="map-controls glassy" role="region" aria-label="Map control panel">
      <input
        v-model="endLocation"
        type="text"
        placeholder="Enter a mental health service..."
        aria-label="Destination input field"
      />
      <button @click="getDirections" aria-label="Get route between your location and destination">🧭 Get Route</button>
      <button @click="searchNearbyServices" aria-label="Find nearby mental health support services">💗 Nearby Support</button>
    </div>

    <transition name="slide">
      <div v-if="nearbyList.length" class="sidebar glassy">
        <h3>💬 Nearby Support</h3>
        <ul>
          <li
            v-for="(place, idx) in nearbyList"
            :key="idx"
            @click="navigateToPlace(place)"
          >
            <strong>{{ place.text }}</strong>
            <p>{{ place.place_name }}</p>
          </li>
        </ul>
      </div>
    </transition>

    <div ref="mapContainer" class="map-container" role="application" aria-label="Interactive map"></div>

    <button class="recenter-btn glassy" @click="recenterToUser" aria-label="Recenter map to your location">📍 My Location</button>

    <transition name="fade">
      <div v-if="tripInfo && endDetails" class="trip-info glassy fixed">
        <h3>🩵 Trip Information</h3>
        <p><strong>From:</strong> Your Location</p>
        <p><strong>To:</strong> {{ endDetails.name }}</p>
        <p><strong>Address:</strong> {{ endDetails.fullAddress }}</p>
        <p><strong>Distance:</strong> {{ tripInfo.distance }} km</p>
        <p><strong>Duration:</strong> {{ tripInfo.duration }} mins</p>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showTip" class="mental-tip glassy" aria-live="polite">
        🌱 Take a deep breath - you're doing great!
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const mapContainer = ref(null)
const map = ref(null)
const userCoords = ref(null)
const endLocation = ref("")
const endCoords = ref(null)
const endDetails = ref(null)
const tripInfo = ref(null)
const showTip = ref(false)
const nearbyList = ref([])

let userMarker = null
let routeLayerId = null
let endMarker = null

onMounted(() => {
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: "mapbox://styles/mapbox/streets-v12",
    center: [144.9631, -37.8136],
    zoom: 13
  })

  getAccurateUserLocation()
})

function getAccurateUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        userCoords.value = [longitude, latitude]
        console.log(`✅ 定位成功: ${latitude}, ${longitude} (±${accuracy}m)`)

        if (userMarker) userMarker.remove()
        const userIcon = document.createElement("div")
        userIcon.innerHTML = "📍"
        userIcon.style.fontSize = "22px"

        userMarker = new mapboxgl.Marker(userIcon)
          .setLngLat(userCoords.value)
          .setPopup(new mapboxgl.Popup().setText("You are here 💚"))
          .addTo(map.value)

        map.value.flyTo({ center: userCoords.value, zoom: 14 })
      },
      async (err) => {
        console.warn("Geolocation error:", err)
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/autoip.json?access_token=${mapboxgl.accessToken}`
        )
        const data = await res.json()
        if (data.features?.length) {
          userCoords.value = data.features[0].center
          map.value.flyTo({ center: userCoords.value, zoom: 13 })
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }
}

function addMarker(coords, title) {
  if (endMarker) endMarker.remove()
  endMarker = new mapboxgl.Marker({ color: "#E91E63" })
    .setLngLat(coords)
    .setPopup(new mapboxgl.Popup().setText(title))
    .addTo(map.value)
}

async function requestRoute(profile, start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
  const res = await fetch(url)
  return await res.json()
}

async function getDirections() {
  if (!userCoords.value) return alert("Please enable location access first.")
  if (!endLocation.value.trim()) return alert("Please enter a destination.")

  const geoData = await geocodeLocation(endLocation.value)
  if (!geoData) return alert("Destination not found.")

  endCoords.value = geoData.center
  endDetails.value = {
    name: geoData.text,
    fullAddress: geoData.place_name
  }
  addMarker(endCoords.value, geoData.place_name)

  let data = await requestRoute("driving", userCoords.value, endCoords.value)
  if (!data.routes?.length)
    data = await requestRoute("walking", userCoords.value, endCoords.value)
  if (!data.routes?.length)
    return alert("No route found — this place may be off the main road.")

  const route = data.routes[0].geometry

  if (routeLayerId && map.value.getLayer(routeLayerId)) {
    map.value.removeLayer(routeLayerId)
    map.value.removeSource("route")
  }

  routeLayerId = "route-" + Date.now()
  map.value.addSource("route", {
    type: "geojson",
    data: { type: "Feature", geometry: route }
  })
  map.value.addLayer({
    id: routeLayerId,
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#2196F3", "line-width": 6 }
  })

  const distance = (data.routes[0].distance / 1000).toFixed(2)
  const duration = (data.routes[0].duration / 60).toFixed(1)
  tripInfo.value = { distance, duration }

  map.value.flyTo({ center: endCoords.value, zoom: 15 })
  showTip.value = true
  setTimeout(() => (showTip.value = false), 5000)
}

async function geocodeLocation(location) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      location
    )}.json?types=poi,place,address,locality,neighborhood,region&limit=1&access_token=${mapboxgl.accessToken}`
  )
  const data = await res.json()
  if (data.features?.length) return data.features[0]
  return null
}

async function searchNearbyServices() {
  if (!userCoords.value) return
  const [lng, lat] = userCoords.value

  const query = "headspace mental health hospital clinic counselling psychology therapy"
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?proximity=${lng},${lat}&types=poi&limit=10&access_token=${mapboxgl.accessToken}`

  console.log("🧭 Nearby support URL:", url)
  console.log("📍 Current userCoords:", userCoords.value)
  
  const res = await fetch(url)
  const data = await res.json()



  nearbyList.value = data.features || []

  if (data.features?.length) {
    data.features.forEach((place) => {
      const coords = place.geometry.coordinates
      new mapboxgl.Marker({ color: "#007AFF" })
        .setLngLat(coords)
        .setPopup(new mapboxgl.Popup().setText(place.text))
        .addTo(map.value)
    })
  } else {
    alert("No nearby support services found.")
  }
}

function navigateToPlace(place) {
  endLocation.value = place.text
  endCoords.value = place.geometry.coordinates
  endDetails.value = {
    name: place.text,
    fullAddress: place.place_name
  }
  getDirections()
}

function recenterToUser() {
  if (userCoords.value && userMarker)
    map.value.flyTo({ center: userCoords.value, zoom: 15 })
}
</script>

<style scoped>
.map-page {
  position: relative;
  width: 100%;
  height: 90vh;
  overflow: hidden;
  background: linear-gradient(to bottom right, #e3f2fd, #e8f5e9);
}
.map-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}
.glassy {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
}
.map-controls {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
}
.map-controls input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 260px;
  font-size: 14px;
}
.map-controls button {
  padding: 8px 14px;
  background: linear-gradient(to right, #4caf50, #81c784);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}
.map-controls button:hover {
  transform: scale(1.05);
}

.sidebar {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 300px;
  height: 70vh;
  overflow-y: auto;
  padding: 16px;
  border-radius: 12px;
  z-index: 10;
}
.sidebar h3 {
  text-align: center;
  color: #4caf50;
  margin-bottom: 10px;
}
.sidebar ul {
  list-style: none;
  padding: 0;
}
.sidebar li {
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: 0.2s;
}
.sidebar li:hover {
  background: #e8f5e9;
}

/* Trip Info */
.trip-info.fixed {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 300px;
  padding: 20px 24px;
  border-radius: 14px;
  font-size: 15px;
  background: white;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

/* My Location button */
.recenter-btn {
  position: absolute;
  bottom: 25px;
  right: 25px;
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 8px;
  background: linear-gradient(to right, #03a9f4, #4fc3f7);
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
  z-index: 10;
}
.recenter-btn:hover {
  transform: scale(1.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
}
.slide-enter-from {
  transform: translateX(-320px);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(-320px);
  opacity: 0;
}
</style>
