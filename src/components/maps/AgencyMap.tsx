import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Agence } from '@/types';

// Fix Leaflet default icon (required for Vite)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const createRenaultIcon = (isSelected: boolean, isNearest: boolean) => L.divIcon({
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -42],
  html: `
    <div style="
      position:relative;
      width:40px;height:40px;
      filter:${isNearest ? 'drop-shadow(0 0 8px #FFCC00)' : 'none'};
      transform:${isSelected ? 'scale(1.25)' : 'scale(1)'};
      transition:transform 0.2s,filter 0.2s;
    ">
      <div style="
        width:36px;height:36px;
        background:${isSelected ? '#FF9900' : '#FFCC00'};
        border:2.5px solid #0A0A0A;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        position:absolute;top:0;left:2px;
      "></div>
      <span style="
        position:absolute;top:6px;left:10px;
        font-family:Syne,sans-serif;font-weight:800;
        font-size:15px;color:#0A0A0A;
        transform:none;z-index:1;
      ">R</span>
      ${isNearest ? `
        <div style="
          position:absolute;top:-6px;right:-4px;
          background:#22C55E;color:white;
          border-radius:10px;padding:1px 5px;
          font-size:9px;font-weight:700;
          border:1.5px solid white;
        ">PROCHE</div>
      ` : ''}
    </div>
  `
});

const userIcon = L.divIcon({
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `
    <div style="
      width:14px;height:14px;background:#3B82F6;
      border-radius:50%;border:3px solid white;
      box-shadow:0 0 0 4px rgba(59,130,246,0.25);
    "></div>
  `
});

function MapController({
  selectedId, agencies, userPos
}: {
  selectedId: string | null;
  agencies: Agence[];
  userPos: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedId) {
      const ag = agencies.find(a => a.id === selectedId);
      if (ag && ag.latitude && ag.longitude) {
        map.flyTo([ag.latitude, ag.longitude], 14, { duration: 1.0 });
      }
    } else if (userPos) {
      map.flyTo(userPos, 8, { duration: 1.0 });
    }
  }, [selectedId, agencies, userPos, map]);
  return null;
}

interface Props {
  agencies: Agence[];
  selectedAgenceId?: string | null;
  nearestAgenceId?: string | null;
  onAgenceSelect?: (agence: Agence) => void;
  height?: string;
  showRadius?: boolean;
  onUserLocation?: (position: [number, number]) => void;
}

export function AgencyMap({
  agencies,
  selectedAgenceId = null,
  nearestAgenceId = null,
  onAgenceSelect,
  height = '480px',
  showRadius = false,
  onUserLocation,
}: Props) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        onUserLocation?.(coords);
      },
      () => setUserPos([36.8065, 10.1815]), // Tunis fallback
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [onUserLocation]);

  const center: [number, number] = userPos ?? [36.8065, 10.1815];
  const visibleAgencies = agencies.filter((agence) => agence.latitude && agence.longitude);

  return (
    <div style={{ height, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,204,0,0.2)' }}>
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          maxZoom={19}
        />

        {userPos && (
          <>
            <Marker position={userPos} icon={userIcon}>
              <Popup>📍 Votre position actuelle</Popup>
            </Marker>
            {showRadius && (
              <Circle
                center={userPos}
                radius={50000}
                pathOptions={{
                  color: '#FFCC00',
                  fillColor: '#FFCC00',
                  fillOpacity: 0.04,
                  weight: 1.5,
                  dashArray: '6 4'
                }}
              />
            )}
          </>
        )}

        {visibleAgencies.map(agence => (
          <Marker
            key={agence.id}
            position={[agence.latitude!, agence.longitude!]}
            icon={createRenaultIcon(
              selectedAgenceId === agence.id,
              nearestAgenceId === agence.id
            )}
            eventHandlers={{ click: () => onAgenceSelect?.(agence) }}
          >
            <Popup closeButton={false}>
              <div className="font-sans min-w-[200px] p-1">
                <div className="font-bold text-sm mb-1">{agence.nom}</div>
                <div className="text-xs text-gray-500 mb-1">📍 {agence.adresse}</div>
                <div className="text-xs text-gray-500 mb-2">📞 {agence.telephone}</div>
                
                {nearestAgenceId === agence.id && (
                  <div className="text-xs bg-green-100 text-green-700 rounded px-2 py-1 mb-2 font-semibold">
                    ✓ Agence recommandée par l'IA
                  </div>
                )}
                
                {onAgenceSelect && (
                  <button
                    onClick={() => onAgenceSelect(agence)}
                    className="w-full bg-[#FFCC00] text-black text-xs font-bold rounded-lg py-2 hover:bg-yellow-400 transition-colors"
                  >
                    Sélectionner cette agence &rarr;
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController
          selectedId={selectedAgenceId}
          agencies={visibleAgencies}
          userPos={userPos}
        />
      </MapContainer>
    </div>
  );
}
