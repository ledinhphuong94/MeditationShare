import React, { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import candleIcon from '../../img/candle2.gif';
import L from 'leaflet';

const MIN_ICON_SIZE = 8;
const MAX_ICON_SIZE = 40;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

// Đưa hàm này ra ngoài component để tránh khởi tạo lại mỗi lần render
const calculateSize = (currentZoom) => {
    if (currentZoom <= MIN_ZOOM) return MIN_ICON_SIZE;
    if (currentZoom >= MAX_ZOOM) return MAX_ICON_SIZE;

    const ratio = (currentZoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
    return Math.round(MIN_ICON_SIZE + (ratio * (MAX_ICON_SIZE - MIN_ICON_SIZE)));
};

const DynamicMarker = ({ position, children, eventHandlers, zoomLevel }) => {
    
    // Icon chỉ được tính toán lại khi zoomLevel từ cha truyền xuống thay đổi
    const dynamicIcon = useMemo(() => {
        const size = calculateSize(zoomLevel);
        const width = size;
        const height = size * (41 / 25);

        return new L.Icon({
            iconUrl: candleIcon,
            iconSize: [width, height],
            // QUAN TRỌNG: Anchor giúp chân nến cố định tại tọa độ khi zoom
            // iconAnchor: [width / 2, height], 
            // popupAnchor: [0, -height],
        });
    }, [zoomLevel]); 

    return (
        <Marker 
            position={position} 
            icon={dynamicIcon} 
            eventHandlers={eventHandlers}
        >
            {children}
        </Marker>
    );
};

export default React.memo(DynamicMarker);