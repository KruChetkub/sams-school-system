import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Polyline } from 'react-leaflet';
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
          if (currentDist !== distanceKmStr) {
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
      
      {/* Floating Distance Overlay */}
      {routeDistance && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-indigo-100 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            🛣️
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold">ระยะทางจากบ้านนักเรียนถึงโรงเรียน</p>
            <p className="text-lg font-black text-indigo-700 leading-tight">
              {routeDistance} <span className="text-sm font-medium text-gray-500">กิโลเมตร</span>
            </p>
          </div>
        </div>
      )}

      {isRouting && !routeDistance && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-amber-100 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
          <p className="text-sm font-bold text-amber-700">กำลังคำนวณเส้นทางและระยะทาง...</p>
        </div>
      )}

      <MapContainer center={center} zoom={11} scrollWheelZoom={false} className="w-full h-full z-0">
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
        </Marker>

        {routeCoords && (
          <Polyline positions={routeCoords} color="#0ea5e9" weight={4} opacity={0.8} />
        )}

        {visits.map((visit) => {
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
                <Popup className="font-sans" onClose={() => { setSelectedVisitId(null); setRouteCoords(null); }}>
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
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}
