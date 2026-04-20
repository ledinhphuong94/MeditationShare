import "leaflet/dist/leaflet.css";
import React, { useState, useMemo } from "react";
import { MapContainer, Popup, useMapEvents, Marker } from "react-leaflet";
import LightMask from "./LightMask.js";
import MyLocationButton from "../MyLocationButton/MyLocationButton.jsx"
import DynamicMarker from "./DynamicMarker.jsx";
import MapTilerVectorLayer from './MapTilerLayer.jsx';
import { createUserIcon, isOnline, getAvatarColor, getInitials } from '../../utils/common.js';
import { useUsersContext } from '../../context/UsersContext.js';

// Tách logic tính size ra ngoài để dùng chung
const calculateLightSize = (zoom) => {
    // Logic này tương đương với hàm trong DynamicMarker của bạn
    // Giúp LightMask và Marker đồng bộ mà không cần gọi callback ngược lên
    const MIN_ICON_SIZE = 5;
    const MAX_ICON_SIZE = 32;
    const ratio = (zoom - 5) / 13; 
    return Math.round(MIN_ICON_SIZE + Math.max(0, Math.min(1, ratio)) * (MAX_ICON_SIZE - MIN_ICON_SIZE));
};

const Mapty = ({ markers, handleClickOnMap, onMarkerClick, mapRef, lang, activeTab = 'candles', onUserMarkerClick, myUserId }) => {
    const [currentZoom, setCurrentZoom] = useState(6);
    const { users, myLocation } = useUsersContext();
    // 1. Chỉ một chỗ duy nhất lắng nghe sự kiện Map
    function MapEventsHandler() {
        const map = useMapEvents({
            click: (e) => {
                if (activeTab !== 'candles') return;
                // Kiểm tra xem có click vào UI điều hướng không
                if (e.originalEvent.target.closest('.my-location-btn')) return;
                handleClickOnMap([e.latlng.lat, e.latlng.lng]);
            },
            zoomend: () => {
                setCurrentZoom(map.getZoom());
            }
        });
        return null;
    }

    // 2. Tính toán size sáng dựa trên zoom (Đồng bộ với Marker)
    const sizeLight = useMemo(() => calculateLightSize(currentZoom), [currentZoom]);

    // 3. Render danh sách User Marker (Dùng useMemo để tránh render lại khi tab khác đang active)
    const userMarkers = useMemo(() => {
        if (activeTab !== 'people') return null;

        const calculateAvatarSize = (zoom) => {
            const minSize = 16;
            const maxSize = 42;
            const ratio = (zoom - 5) / 13; // Dựa trên dải zoom từ 5 đến 18
            return Math.round(minSize + Math.max(0, Math.min(1, ratio)) * (maxSize - minSize));
        };
        
        const dynamicSize = calculateAvatarSize(currentZoom);

        return users.map((user) => (
            user.lat && user.lng && (
                <Marker
                    key={user.user_id}
                    position={[user.lat, user.lng]}
                    icon={createUserIcon(user, dynamicSize)}
                    eventHandlers={{ click: () => onUserMarkerClick(user.user_id) }}
                >
                    <Popup className="user-popup">
                        <UserPopupContent user={user} myUserId={myUserId} />
                    </Popup>
                </Marker>
            )
        ));
    }, [users, activeTab, myUserId, onUserMarkerClick, currentZoom]);

    return (
        <MapContainer
            center={[16, 108]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef} // Leaflet v1.x dùng ref thay vì whenCreated
        >
            <MapTilerVectorLayer lang={lang} />
            <MapEventsHandler />

            {activeTab === 'candles' && (
                <>
                    <LightMask markers={markers} spotlightRadius={sizeLight * 1.5} mapRef={mapRef} />
                    {markers.map((m) => (
                        <DynamicMarker
                            key={m.id}
                            position={[m.lat, m.lng]}
                            zoomLevel={currentZoom} // Truyền zoom xuống thay vì đợi callback ngược lên
                            eventHandlers={{ click: () => onMarkerClick(m.id) }}
                        >
                            <Popup className="map-popup">
                                <div>
                                    <strong>{m.name}</strong><br />
                                    {m.message}<br />
                                    <small>{new Date(m.created_at).toLocaleString()}</small>
                                </div>
                            </Popup>
                        </DynamicMarker>
                    ))}
                </>
            )}

            {userMarkers}

            <MyLocationButton mapRef={mapRef} handleClickOnMap={handleClickOnMap} />
        </MapContainer>
    );
};

// Component nhỏ hỗ trợ hiển thị Popup User
const UserPopupContent = ({ user, myUserId }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
        <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: getAvatarColor(user.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
            {getInitials(user.name)}
        </div>
        <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
                {user.name} {user.user_id === myUserId && "(You)"}
            </div>
            <div style={{ fontSize: 11, color: isOnline(user.last_seen) ? '#52c41a' : '#999' }}>
                {isOnline(user.last_seen) ? '● Online' : '● Offline'}
            </div>
        </div>
    </div>
);

export default React.memo(Mapty);