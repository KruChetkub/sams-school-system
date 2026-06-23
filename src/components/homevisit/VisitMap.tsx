import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import geojsonData from '../../../exports/geojson/chiang_khong_district.geojson?url';
import { updateHomeVisit } from '../../services/homevisit/visitService';
import type { HomeVisit } from '../../services/homevisit/visitService';

// Fix Leaflet's default icon issue with React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom Icons based on Risk Level
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  NORMAL: createIcon('green'),
  WATCH: createIcon('orange'),
  URGENT: createIcon('red'),
  DEFAULT: createIcon('blue')
};

// Helper component to recenter the map dynamically to fit both the school and the active student coordinates.
function MapRecenter({ schoolCoords, studentCoords }: { schoolCoords: [number, number]; studentCoords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (studentCoords && studentCoords[0] && studentCoords[1]) {
      const bounds = L.latLngBounds([schoolCoords, studentCoords]);
      // Increased padding (x: 100px, y: 120px) to prevent floating tooltip text labels from being cropped at the map boundaries
      map.fitBounds(bounds, { 
        padding: [100, 120], 
        maxZoom: 15 
      });
    } else {
      map.setView(schoolCoords, 13);
    }
  }, [schoolCoords, studentCoords]);
  return null;
}

// Helper component to fix Leaflet size rendering bugs on mount/toggle
function MapResizeTrigger() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Custom Zoom Slider Control
function ZoomSlider() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const minZoom = map.getMinZoom();
  const maxZoom = map.getMaxZoom();

  useEffect(() => {
    const handleZoomEnd = () => {
      setZoom(map.getZoom());
    };
    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseInt(e.target.value, 10);
    map.setZoom(newZoom);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute top-4 left-4 z-[1000] flex flex-col items-center bg-white rounded-xl shadow-md border border-gray-200/80 overflow-hidden select-none"
    >
      <style>{`
        .custom-zoom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 10px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 3px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        .custom-zoom-slider::-moz-range-thumb {
          width: 18px;
          height: 10px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 3px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        .custom-zoom-slider::-webkit-slider-runnable-track {
          background: transparent;
        }
      `}</style>

      {/* Zoom In Button */}
      <button 
        onClick={handleZoomIn}
        disabled={zoom >= maxZoom}
        className="w-8 h-8 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer"
        title="Zoom in"
      >
        ＋
      </button>

      {/* Slider Area */}
      <div className="h-28 py-2.5 flex items-center justify-center bg-gray-50/50 border-y border-gray-100 w-8">
        <input 
          type="range"
          min={minZoom}
          max={maxZoom}
          value={zoom}
          onChange={handleSliderChange}
          className="custom-zoom-slider cursor-pointer"
          style={{
            writingMode: 'vertical-lr',
            WebkitWritingMode: 'vertical-lr',
            direction: 'rtl',
            width: '4px',
            height: '100px',
            background: '#cbd5e1',
            borderRadius: '2px',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none'
          }}
        />
      </div>

      {/* Zoom Out Button */}
      <button 
        onClick={handleZoomOut}
        disabled={zoom <= minZoom}
        className="w-8 h-8 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-45 disabled:hover:bg-transparent cursor-pointer"
        title="Zoom out"
      >
        －
      </button>
    </div>
  );
}

interface VisitMapProps {
  visits: HomeVisit[];
  externalRouteTargetId?: string | null;
  onRouteTargetHandled?: () => void;
  onDistanceUpdated?: () => void;
}

export default function VisitMap({ visits, externalRouteTargetId, onRouteTargetHandled, onDistanceUpdated }: VisitMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const activeVisit = visits.find(v => v.id === (selectedVisitId || externalRouteTargetId)) || (visits.length === 1 ? visits[0] : null);
  const studentCoords: [number, number] | null = activeVisit && activeVisit.latitude && activeVisit.longitude
    ? [activeVisit.latitude, activeVisit.longitude]
    : null;

  useEffect(() => {
    if (externalRouteTargetId) {
      const visit = visits.find(v => v.id === externalRouteTargetId);
      if (visit && visit.latitude && visit.longitude) {
        handleMarkerClick(visit.id, visit.latitude, visit.longitude);
      }
      if (onRouteTargetHandled) onRouteTargetHandled();
    }
  }, [externalRouteTargetId, visits]);

  // Adjusted coordinates to pin directly on the school area
  const SCHOOL_LAT = 20.2445000;
  const SCHOOL_LNG = 100.4125000;
  
  const schoolIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  useEffect(() => {
    // Vite imports non-json files as URL strings
    if (typeof geojsonData === 'string') {
      fetch(geojsonData)
        .then(res => res.json())
        .then(data => setGeoData(data))
        .catch(err => console.error('Error loading geojson:', err));
    } else {
      setGeoData(geojsonData);
    }
  }, []);

  // Center of Chiang Khong district roughly
  const center: [number, number] = [20.2625, 100.4046];

  const getRiskIcon = (visit: any) => {
    // We might not have assessment data in the basic visits query, but we try to extract it if we joined it
    const risk = visit.home_visit_assessments?.[0]?.risk_level || visit.risk_level;
    if (risk === 'NORMAL') return icons.NORMAL;
    if (risk === 'WATCH') return icons.WATCH;
    if (risk === 'URGENT') return icons.URGENT;
    return icons.DEFAULT;
  };

  const getRiskLabel = (visit: any) => {
    const risk = visit.home_visit_assessments?.[0]?.risk_level || visit.risk_level;
    if (risk === 'NORMAL') return 'ปกติ';
    if (risk === 'WATCH') return 'เฝ้าระวัง';
    if (risk === 'URGENT') return 'ช่วยเหลือเร่งด่วน';
    return '-';
  };

  const getFeatureStyle = () => {
    return {
      color: '#3b82f6', // Blue border
      weight: 2,
      opacity: 0.6,
      fillColor: 'transparent',
      fillOpacity: 0
    };
  };

  const handleMarkerClick = async (visitId: string, lat: number, lng: number) => {
    setSelectedVisitId(visitId);
    setRouteCoords(null);
    setRouteDistance(null);
    setIsRouting(true);
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${SCHOOL_LNG},${SCHOOL_LAT};${lng},${lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
        setRouteCoords(coords);
        
        const distanceKmStr = (data.routes[0].distance / 1000).toFixed(1);
        setRouteDistance(distanceKmStr);

        // Update database silently if distance is missing or different
        const visit = visits.find(v => v.id === visitId);
        if (visit) {
          const currentDist = visit.distance_to_school ? visit.distance_to_school.toFixed(1) : null;
          if (currentDist !== distanceKmStr && !visitId.startsWith('preview_')) {
            updateHomeVisit(visitId, { distance_to_school: parseFloat(distanceKmStr) })
              .then(() => {
                if (onDistanceUpdated) onDistanceUpdated();
              })
              .catch(err => console.error('Failed to update distance silently:', err));
          }
        }
      }
    } catch (err) {
      console.error('Routing error:', err);
    } finally {
      setIsRouting(false);
    }
  };
  return (
    <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      {selectedVisitId && (
        <button
          onClick={() => {
            setSelectedVisitId(null);
            setRouteCoords(null);
            setRouteDistance(null);
          }}
          className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-4 py-2.5 text-sm font-black text-emerald-700 bg-white border border-emerald-100 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          🔄 กลับสู่ภาพรวม
        </button>
      )}

      <MapContainer center={center} zoom={11} scrollWheelZoom={false} zoomControl={false} className="w-full h-full z-0">
        <MapResizeTrigger />
        <ZoomSlider />
        <MapRecenter schoolCoords={[SCHOOL_LAT, SCHOOL_LNG]} studentCoords={studentCoords} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {geoData && (
          <GeoJSON 
            data={geoData} 
            style={getFeatureStyle}
          />
        )}

        <Marker position={[SCHOOL_LAT, SCHOOL_LNG]} icon={schoolIcon}>
          <Popup className="font-sans">
            <strong className="text-base text-violet-800">🏫 โรงเรียนเชียงของวิทยาคม</strong>
            <p className="text-xs text-gray-500 mt-1">จุดศูนย์กลางการคำนวณระยะทาง</p>
          </Popup>
          <Tooltip permanent direction="top" offset={[0, -40]} className="font-sans font-bold text-xs bg-white text-violet-800 px-2 py-1 rounded shadow border border-violet-200">
            🏫 โรงเรียนเชียงของวิทยาคม
          </Tooltip>
        </Marker>

        {routeCoords && (
          <Polyline positions={routeCoords} color="#0ea5e9" weight={4} opacity={0.8} />
        )}

        {(selectedVisitId ? visits.filter(v => v.id === selectedVisitId) : visits).map((visit) => {
          if (visit.latitude && visit.longitude) {
            const isSelected = selectedVisitId === visit.id;
            return (
              <Marker 
                key={visit.id} 
                position={[visit.latitude, visit.longitude]}
                icon={getRiskIcon(visit)}
                eventHandlers={{
                  click: () => handleMarkerClick(visit.id, visit.latitude!, visit.longitude!)
                }}
              >
                <Popup className="font-sans" onClose={() => { setSelectedVisitId(null); setRouteCoords(null); setRouteDistance(null); }}>
                  <div className="font-sans text-sm min-w-[200px]">
                    <strong className="text-base text-gray-900 block mb-1">
                      {visit.student?.first_name} {visit.student?.last_name}
                    </strong>
                    <div className="text-gray-600 mb-1">
                      วันที่เยี่ยม: {new Date(visit.visit_date).toLocaleDateString('th-TH')}
                    </div>
                    <div>
                      สถานะ: <span className="font-bold">{getRiskLabel(visit)}</span>
                    </div>
                    {isSelected && routeDistance && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-indigo-600 font-bold">
                        🛣️ ระยะทางจากโรงเรียน: {routeDistance} กม.
                      </div>
                    )}
                    {isSelected && isRouting && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-amber-600 font-medium text-xs">
                        กำลังคำนวณเส้นทาง...
                      </div>
                    )}
                  </div>
                </Popup>
                <Tooltip permanent direction="top" offset={[0, -40]} className="font-sans font-bold text-xs bg-white text-emerald-800 px-2 py-1 rounded shadow border border-emerald-200">
                  🏠 {visit.student?.first_name} {visit.student?.last_name}
                </Tooltip>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}
