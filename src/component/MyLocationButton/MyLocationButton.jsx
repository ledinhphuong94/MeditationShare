import './MyLocationButton.css';
import React, { useState, useEffect } from 'react';
import { Popup, CircleMarker  } from "react-leaflet";
import { GiPositionMarker } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { useUsersContext } from '../../context/UsersContext.js';

const MyLocationButton = ({mapRef, handleClickOnMap}) => {
  const { t } = useTranslation();
  const { users, myLocation } = useUsersContext();
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
  const handleGetLocation = async () => {
    if (!navigator.geolocation || myLocation === null) {
        alert(t("alert.location_unavailable"));
        return;
    }
    const { lat, lng } = myLocation;
    setCurrLocation({
        latitude: lat,
        longitude: lng,
      });
    localStorage.setItem('meditation_currPos', JSON.stringify([lat, lng])); 
    setIsLoading(false);
    map.flyTo([lat , lng], 15, { duration: 1 });
    setTimeout(() => {
        map.eachLayer(layer => {
            if (layer._latlng && layer._latlng.lat === lat && layer._latlng.lng === lng) {
                layer.openPopup();
            }
        });
    }, 500);
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
