import "leaflet/dist/leaflet.css";
import candleIcon from '../../img/candle2.gif';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import LightMask from "./LightMask";

  const popupStyle = {
    zIndex: 9999,
  };

// Icon mặc định của Leaflet
const DefaultIcon = L.icon({
    iconUrl: candleIcon,
    // shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize:     [30, 40], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
L.Marker.prototype.options.icon = DefaultIcon;

const Mapty = ({ markers, handleClickOnMap, onMarkerClick, mapRef }) => {

    // ============================
    // 4. Click map để tạo marker
    // ============================
    function MapClickHandler() {
        useMapEvents({
        click: async (e) => {
            // if (!name) return alert("Nhập tên thiền sinh trước!");
            // if (!message) return alert("Nhập message trước!");
            handleClickOnMap([e.latlng.lat, e.latlng.lng])
        },
        });

        return null;
    }

    return (
        <MapContainer
            center={[10.8231, 106.6297]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => (mapRef.current = map)}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler />

            <LightMask markers={markers} spotlightRadius={30} mapRef={mapRef} />

            {markers.map((m) => (
                <>
                    <Marker 
                        key={m.id} 
                        position={[m.lat, m.lng]}
                        eventHandlers={{
                            click: () => {
                                console.log('>>>', m.id)
                                onMarkerClick(m.id) 
                            } 
                        }}
                    >
                        <Popup>
                            <div style={popupStyle}>
                                <strong>{m.name}</strong>
                                <br />
                                {m.message}
                                <br />
                                <small>{new Date(m.created_at).toLocaleString()}</small>
                            </div>
                        </Popup>
                       
                    </Marker>
                </>
            ))}
        </MapContainer>
        );
        
};

export default Mapty;