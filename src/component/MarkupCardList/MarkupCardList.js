import './MarkupCardList.css'
import { useEffect } from "react";
const styles = {
    listContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "10px",
        transition:"all 1s",
    },
    card: {
        background: "#ffffff",
        borderRadius: "10px",
        padding: "10px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        border: "1px solid #e5e5e5",
        cursor: "pointer",
        
    },
    title: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "600",
        color: "#333",
        
    },
    message: {
        margin: "8px 0",
        fontSize: "13px",
        color: "#555",
    },
    date: {
        fontSize: "12px",
        color: "#888",
        marginTop: "4px",
    },
};

export default function MarkupCardList({ markers, activeId, mapRef }) {
    useEffect(() => {
        const el = document.querySelector(`[data-id="${activeId}"]`);
        if (!el) return;
        // scroll to the card
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        // highlight 2 seconds
        el.classList.add("card-highlight");
        setTimeout(() => el.classList.remove("card-highlight"), 2000);

    }, [activeId]);

    return (
        <>
            <h2 className='markupTitle' style={{textAlign: "center"}}>Bản đồ ánh sáng</h2>
            <div style={styles.listContainer}>
            {markers.map((item, index) => (
                <div 
                    className="card"
                    data-id={item.id} 
                    key={index} 
                    style={styles.card}
                    onClick={() => {
                            const map = mapRef.current;
                            if (map) {
                            map.flyTo([item.lat, item.lng], 13, { duration: 1 });

                            setTimeout(() => {
                                map.eachLayer(layer => {
                                if (layer._latlng && layer._latlng.lat === item.lat && layer._latlng.lng === item.lng) {
                                    layer.openPopup();
                                }
                                });
                            }, 500);
                        }
                    }}
                >
                    <h3 
                        className="titleCard"
                        style={styles.title}
                    >{item.name}</h3>

                    <p style={styles.message}>{item.message}</p>

                    <div style={styles.date}>
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                    </div>
                </div>
            ))}
            </div>
        </>
    );
}


