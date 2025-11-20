// LightMask.jsx
import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet'; // Cần import Leaflet nếu markerPosition là object {lat, lng}

const LightMask = ({ markers, spotlightRadius = 25, mapRef }) => {
  const map = useMap();
  mapRef.current = map;
  // State lưu trữ tọa độ pixel của tất cả các lỗ tròn
  const [holeCenters, setHoleCenters] = useState([]);

  // Hàm tính toán tọa độ pixel của TẤT CẢ Marker
  const updateHolePositions = () => {
    const newHoleCenters = markers.map(marker => {
      let latLng;
      
      // Kiểm tra định dạng: Nếu là mảng [lat, lng]
      if (Array.isArray(marker)) {
        latLng = L.latLng(marker[0], marker[1]);
      } 
      // Nếu là đối tượng { lat, lng }
      else if (marker.lat && marker.lng) {
        latLng = L.latLng(marker.lat, marker.lng);
      } 
      // Xử lý nếu định dạng không khớp (có thể bỏ qua hoặc báo lỗi)
      else {
        return null; 
      }
      // Chuyển đổi tọa độ LatLng (địa lý) sang ContainerPoint (pixel màn hình)
      const point = map.latLngToContainerPoint(latLng);
      return { x: point.x, y: point.y };
    }).filter(p => p !== null); // Lọc bỏ các giá trị null

    setHoleCenters(newHoleCenters);
  };

  useEffect(() => {
    const popupPane = map.getPane('popupPane');
    const tooltipPane = map.getPane('tooltipPane');
    popupPane.style.zIndex = 1500;
    tooltipPane.style.zIndex = 1500;
    // 1. Cập nhật vị trí lần đầu và khi markers props thay đổi
    updateHolePositions(); 

    // 2. Lắng nghe sự kiện di chuyển và zoom của bản đồ
    map.on('move', updateHolePositions);
    map.on('zoom', updateHolePositions);
    
    // 3. Cleanup event listeners khi component unmount
    return () => {
      map.off('move', updateHolePositions);
      map.off('zoom', updateHolePositions);
    };
  }, [map, markers]); // Re-run khi map hoặc markers thay đổi

  // CSS để overlay luôn phủ kín MapContainer
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none', // Cho phép tương tác với bản đồ bên dưới
    zIndex: 400,
  };

  // return (
  //   <div style={overlayStyle}>
  //     <svg width="100%" height="100%">
  //       {/* Định nghĩa Mask */}
  //       <mask id="lightMask">
  //         {/* Lớp nền Mask: Màu trắng (trong suốt) phủ kín */}
  //         <rect x="0" y="0" width="100%" height="100%" fill="white" />
          
  //         {/* Lỗ tròn: Vẽ các hình tròn màu đen tại vị trí các Marker */}
  //         {holeCenters.map((center, index) => (
  //           <circle 
  //             key={index}
  //             cx={center.x} 
  //             cy={center.y} 
  //             r={spotlightRadius} 
  //             fill="black" 
  //           />
  //         ))}
  //       </mask>
        
  //       {/* Hình chữ nhật áp dụng Mask */}
  //       {/* Lớp phủ màu đen/xám với 50% opacity */}
  //       <rect 
  //         x="0" y="0" width="100%" height="100%" 
  //         fill="rgba(0, 0, 0, 0.6)" 
  //         mask="url(#lightMask)" 
  //       />
  //     </svg>
  //   </div>
  // );

  return (
      <div style={overlayStyle}>
        <svg width="100%" height="100%">
          
          {/* MASK chứa gradient mềm */}
          <mask id="lightMask">
            {/* Nền trắng → toàn bộ bị che */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />

            {/* Tạo hiệu ứng ánh sáng cho từng marker */}
            {holeCenters.map((center, index) => (
              <g key={index}>
                {/* Radial gradient cho ánh sáng mềm */}
                <radialGradient id={`spotlight-${index}`}>
                  <stop offset="0%" stopColor="black" stopOpacity="1" />
                  <stop offset="80%" stopColor="black" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.5" />
                </radialGradient>

                {/* Vùng ánh sáng */}
                <circle
                  cx={center.x}
                  cy={center.y}
                  r={spotlightRadius}
                  fill={`url(#spotlight-${index})`}
                />
              </g>
            ))}
          </mask>

          {/* Overlay màu tối */}
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#lightMask)"
          />
        </svg>
      </div>
    );

};

export default LightMask;