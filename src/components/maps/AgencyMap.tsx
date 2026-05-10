import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { Agence } from "@/types";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

const renaultIcon = L.divIcon({
  html: `<div style="width:36px;height:36px;background:#FFCC00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #0A0A0A;display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;font-weight:bold">R</span></div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const userIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.3)"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface Props {
  agencies: Agence[];
  selectedAgenceId?: string;
  onAgenceSelect?: (agence: Agence) => void;
  showUserLocation?: boolean;
  height?: string;
  onUserLocation?: (position: [number, number]) => void;
}

export function AgencyMap({
  agencies,
  selectedAgenceId,
  onAgenceSelect,
  showUserLocation = true,
  height = "400px",
  onUserLocation,
}: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!showUserLocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(next);
        onUserLocation?.(next);
      },
      () => {},
    );
  }, [onUserLocation, showUserLocation]);

  const center: [number, number] = userPos ?? [36.8065, 10.1815];
  const visibleAgencies = agencies.filter((agence) => agence.latitude && agence.longitude);

  return (
    <MapContainer center={center} zoom={7} style={{ height, borderRadius: "12px" }} className="z-0">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />
      {userPos && (
        <Marker position={userPos} icon={userIcon}>
          <Popup>Votre position</Popup>
        </Marker>
      )}
      {visibleAgencies.map((agence) => (
        <Marker
          key={agence.id}
          position={[agence.latitude!, agence.longitude!]}
          icon={renaultIcon}
          eventHandlers={{ click: () => onAgenceSelect?.(agence) }}
        >
          <Popup>
            <div style={{ fontFamily: "DM Sans, sans-serif", minWidth: "180px" }}>
              <strong>{agence.nom}</strong>
              <br />
              <span style={{ color: "#6B6A65", fontSize: "13px" }}>{agence.adresse}</span>
              <br />
              <span style={{ fontSize: "12px" }}>{agence.telephone}</span>
              <button
                onClick={() => onAgenceSelect?.(agence)}
                style={{
                  display: "block",
                  marginTop: "8px",
                  background: "#FFCC00",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Sélectionner cette agence
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      <FlyToSelected agencies={visibleAgencies} selectedId={selectedAgenceId} />
    </MapContainer>
  );
}

function FlyToSelected({ agencies, selectedId }: { agencies: Agence[]; selectedId?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const agence = agencies.find((item) => item.id === selectedId);
    if (agence?.latitude && agence.longitude) {
      map.flyTo([agence.latitude, agence.longitude], 13, { duration: 1.2 });
    }
  }, [agencies, map, selectedId]);
  return null;
}
