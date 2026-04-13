// src/utils/getLocation.js
export const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
        (position) => {
            resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        },
        (error) => {
            console.error("GPS error:", error);

            switch (error.code) {
            case 1:
                reject("User denied location permission");
                break;
            case 2:
                reject("Location unavailable");
                break;
            case 3:
                reject("Location timeout");
                break;
            default:
                reject("Unknown error");
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
        );
    });
};
        
