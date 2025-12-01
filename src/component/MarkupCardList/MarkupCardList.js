import './MarkupCardList.css'
import { useEffect } from "react";
import { BiMessageSquareEdit } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";
import { useUser } from '../../UserContext.js';

export default function MarkupCardList({ markers, activeId, mapRef, handleUpdateMess, handleDeleteMess }) {
    const { userInfo } = useUser();

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
        <div className="list-markups">
            <div className='list-markups-container'>
            {markers.map((item, index) => (
                <div 
                    className="card" /* Thay thế style={styles.card} */
                    data-id={item.id} 
                    key={index} 
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
                    <div className="title-card"><h3>{item.name}</h3>  {userInfo.userId === item.user_id ? ( <span>(Bạn)</span>) : ""}</div>
                    <div className="message-container">
                        <p className="message">{item.message}</p> 
                        {userInfo.userId === item.user_id ? (
                            <div 
                                className="edit-icon"
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleUpdateMess(item)
                                }}
                            >
                                <BiMessageSquareEdit  size={18} />

                            </div>
                        ) : ''}

                        {userInfo.userRole === 'admin' ? (
                            <div 
                                className="delete-icon"
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleDeleteMess(item)
                                }}
                            >
                                <MdDeleteForever  size={20} />

                            </div>
                        ) : ''}
                    </div>
                   

                    <div className="date"> 
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                    </div>
                </div>
            ))}
            </div>
        </div>
    
    );
}


