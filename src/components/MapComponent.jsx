import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Badge } from "./ui/Card.jsx";

// Fix for default Leaflet marker icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export function MapComponent({ items = [], type = "jobs" }) {
  // Approximate center (e.g. Kolhapur/Pune region)
  const defaultCenter = [16.7050, 74.2433];

  return (
    <div className="h-[400px] w-full rounded-3xl overflow-hidden border border-white/10 shadow-lg">
      <MapContainer center={defaultCenter} zoom={11} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {items.map((item, idx) => {
          // Use provided coordinates or generate a slight random offset for demo purposes
          let pos = defaultCenter;
          if (item.coordinates) {
            try {
              pos = JSON.parse(item.coordinates);
            } catch (e) {
              pos = [defaultCenter[0] + (Math.random() - 0.5) * 0.1, defaultCenter[1] + (Math.random() - 0.5) * 0.1];
            }
          } else {
            pos = [defaultCenter[0] + (Math.random() - 0.5) * 0.1, defaultCenter[1] + (Math.random() - 0.5) * 0.1];
          }
          
          return (
            <Marker key={item.id || idx} position={pos}>
              <Popup className="rounded-xl">
                <div className="text-slate-900 p-1 min-w-[150px]">
                  <h3 className="font-bold text-sm">{item.title || item.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{item.location}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-emerald-600">
                      {type === "jobs" ? `₹${item.budget}` : `Rating: ${item.rating || 4.5}`}
                    </span>
                    <Link to={type === "jobs" ? "/jobs" : "/workers"} className="text-xs text-blue-600 underline">View</Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
