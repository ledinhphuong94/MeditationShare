import './MyLocationButton.css';
import React, { useState, useEffect } from 'react';
import { Popup, CircleMarker  } from "react-leaflet";
import { GiPositionMarker } from "react-icons/gi";
import { useTranslation } from "react-i18next";

const MyLocationButton = ({mapRef, handleClickOnMap}) => {
  const { t } = useTranslation();
  const map = mapRef.current;
  useEffect(() => {
      const pos = JSON.parse(localStorage.getItem('meditation_currPos'));
      if (pos) {
           map.flyTo(pos, 13, {
          duration: 1.5 // Thời gian di chuyển (giúp mượt mà hơn)
      }); 
          
      };
     
  }, []);

  const [currLocation, setCurrLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  
  // Hàm xử lý khi nút được click
  const handleGetLocation = () => {

    // Reset trạng thái
    // setLocation(null);
    // setError(null);
    setIsLoading(true);

    // Kiểm tra xem trình duyệt có hỗ trợ Geolocation không
    if (!navigator.geolocation) {
      setIsLoading(false);
      alert(t("alert.browser_not_support_location"));
      return;
    }

    // Gọi API để lấy vị trí hiện tại
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        localStorage.setItem('meditation_currPos', JSON.stringify([position.coords.latitude, position.coords.longitude])); 
        setIsLoading(false);
        map.flyTo([position.coords.latitude , position.coords.longitude], 15, { duration: 1 });
        setTimeout(() => {
            map.eachLayer(layer => {
                if (layer._latlng && layer._latlng.lat === position.coords.latitude && layer._latlng.lng === position.coords.longitude) {
                    layer.openPopup();
                }
            });
        }, 500);
      },
      (err) => {
        // Xử lý lỗi (ví dụ: người dùng từ chối cấp quyền)
        let errorMessage = '';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = t("alert.refuse_share_location");
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = t("alert.location_unavailable");
            break;
          case err.TIMEOUT:
            errorMessage = t("alert.location_request_timeout");
            break;
          default:
            errorMessage = t("alert.unknown_error");
        }
        // setError(errorMessage);
        setIsLoading(false);
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true, // Yêu cầu độ chính xác cao nhất có thể
        // timeout: 5000,           // Thời gian chờ tối đa 5 giây
        maximumAge: 0            // Không sử dụng cache
      }
    );
  };

  return (
    <>
      <button
        className="my-location-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleGetLocation();
        }} 
        disabled={isLoading}
      >
        <GiPositionMarker size={13} />
        {isLoading ? t("dashboard.getting_location") : t("dashboard.my_location")}
      </button>
      {
        currLocation ? 
        <CircleMarker 
          center={[currLocation.latitude, currLocation.longitude]} 
          pathOptions={{
            color: 'blue',
            fillColor: '#007bff',
            fillOpacity: 0.8,
            weight: 2
          }} 
          radius={8}
          eventHandlers={{
              click: () => {
                  handleClickOnMap([currLocation.latitude, currLocation.longitude]) 
              } 
          }}
        >
            <Popup>{t("dashboard.you_are_here")}</Popup>
          </CircleMarker> : ''       
      }
      
    </>

  );
};

export default MyLocationButton;
