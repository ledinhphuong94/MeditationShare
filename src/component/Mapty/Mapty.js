import React, { useMemo, useState } from 'react';
import "leaflet/dist/leaflet.css";
import candleIcon from '../../img/candle2.gif';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import LightMask from "./LightMask";
import MyLocationButton from "../MyLocationButton/MyLocationButton.js"
import DynamicMarker from "./DynamicMarker.js";

const Mapty = ({ markers, handleClickOnMap, onMarkerClick, mapRef }) => {
    // ============================
    // Click map để tạo marker
    // ============================
    function MapClickHandler() {
        useMapEvents({
            click: async (e) => {
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
            
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
             
            <MapClickHandler />

            <LightMask markers={markers} spotlightRadius={30} mapRef={mapRef} />

            {markers.map((m) => (
                <>
                    <DynamicMarker 
                        keyProp={m.id} 
                        position={[m.lat, m.lng]}
                        eventHandlers={{
                            click: () => {
                                onMarkerClick(m.id) 
                            } 
                        }}
                    >
                        <Popup className="map-popup" key={`popup_${m.id}`}>
                            <div>
                                <strong>{m.name}</strong>
                                <br />
                                {m.message}
                                <br />
                                <small>{new Date(m.created_at).toLocaleString()}</small>
                            </div>
                        </Popup>
                       
                    </DynamicMarker>
                </>
            ))}

            <MyLocationButton mapRef={mapRef} handleClickOnMap={handleClickOnMap} />
        </MapContainer>
        );
        
};

export default Mapty;