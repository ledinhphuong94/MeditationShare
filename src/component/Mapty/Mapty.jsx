import "leaflet/dist/leaflet.css";
import { MapContainer, Popup, useMapEvents, Marker } from "react-leaflet";
import LightMask from "./LightMask.js";
import MyLocationButton from "../MyLocationButton/MyLocationButton.jsx"
import DynamicMarker from "./DynamicMarker.js";
import MapTilerVectorLayer from './MapTilerLayer.jsx';
import { createUserIcon, isOnline, getAvatarColor, getInitials } from '../../utils/common.js';

const Mapty = ({ markers, handleClickOnMap, onMarkerClick, mapRef, lang, activeTab = 'candles', users = [], onUserMarkerClick, myUserId }) => {

    function MapClickHandler() {
        useMapEvents({
            click: async (e) => {
                // Chỉ cho click thêm nến khi ở tab candles
                if (activeTab !== 'candles') return
                if (e.originalEvent.target.classList.value === 'my-location-btn') return;
                handleClickOnMap([e.latlng.lat, e.latlng.lng])
            },
        });
        return null;
    }

    return (
        <MapContainer
            center={[16, 108]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => (mapRef.current = map)}
        >
            <MapTilerVectorLayer lang={lang} />
            <MapClickHandler />

            {/* Chỉ hiện LightMask & markers nến khi tab candles */}
            {activeTab === 'candles' && (
                <>
                    <LightMask markers={markers} spotlightRadius={30} mapRef={mapRef} />

                    {markers.map((m) => (
                        <DynamicMarker
                            key={m.id}
                            keyProp={m.id}
                            position={[m.lat, m.lng]}
                            eventHandlers={{
                                click: () => onMarkerClick(m.id)
                            }}
                        >
                            <Popup className="map-popup">
                                <div>
                                    <strong>{m.name}</strong>
                                    <br />
                                    {m.message}
                                    <br />
                                    <small>{new Date(m.created_at).toLocaleString()}</small>
                                </div>
                            </Popup>
                        </DynamicMarker>
                    ))}
                </>
            )}

            {/* Chỉ hiện avatar users khi tab people */}
            {activeTab === 'people' && users.map((user) =>
                user.lat && user.lng && (
                    <Marker
                        key={user.user_id}
                        position={[user.lat, user.lng]}
                        icon={createUserIcon(user)}
                        eventHandlers={{
                            click: () => onUserMarkerClick(user.user_id)
                        }}
                    >
                        <Popup className="user-popup">
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '2px 0',
                            }}>
                                <div style={{
                                    width: 28, height: 28,
                                    borderRadius: '50%',
                                    background: getAvatarColor(user.name),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}>
                                    {getInitials(user.name)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name} {user.user_id === myUserId && "(You)"}</div>
                                    <div style={{
                                        fontSize: 11,
                                        color: isOnline(user.last_seen) ? '#52c41a' : '#999'
                                    }}>
                                        {isOnline(user.last_seen) ? '● Online' : '● Offline'}
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )
            )}

            <MyLocationButton mapRef={mapRef} handleClickOnMap={handleClickOnMap} />
        </MapContainer>
    );
};

export default Mapty;