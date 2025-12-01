import React, {useState, useEffect} from 'react';
import * as helper from "../../common/helper.js";
import './MessageModal.css';
import { useUser } from '../../UserContext.js';

const MessageModal = ({ formData, isOpen, onClose, onSubmit }) => {
    const { userInfo } = useUser();
    const { userRole, userId, username } = userInfo;

    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    useEffect(() => {
        let defaultName = username === 'Anonymous' ? '' : username;
        setName(formData ? formData.name : defaultName || window.localStorage.getItem("meditation_user_name"));
        setMessage(formData ? formData.message : '');
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey)
        }
    }, [formData, isOpen, onClose]);
    // Nếu modal không mở thì không render gì cả
    if (!isOpen) return null;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && message.trim()) {
            // Kiểm tra xem có link lạ không?
            if (helper.containsForbiddenContent(name.trim())) {
                alert("Tên không được phép chứa đường dẫn!")
                return;
            };
            if (helper.containsProfanity(name.trim())) {
                alert("Tên không hợp lệ!")
                return;
            };
            if (helper.containsForbiddenContent(message.trim())) {
                alert("Thông điệp không được chứa đường dẫn!")
                return;
            };
            if (helper.containsProfanity(message.trim())) {
                alert("Thông điệp không hợp lệ!")
                return;
            };
            // Gọi hàm onSubmit từ component cha, truyền dữ liệu
            onSubmit({ name, message, messId: formData ? formData.id : 0, isEdited: !!formData });
            
            // // Reset form và đóng modal
            setName('');
            setMessage('');
            onClose();
        } else {
            alert('Vui lòng nhập cả Tên và Thông điệp.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                
                <button className="close-button" onClick={onClose}>&times;</button>
                
                <h2>Hãy gửi một thông điệp đến thế giới</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Tên:</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn A"
                            disabled={!!formData} 
                            required
                            style={{ backgroundColor: !!formData ? '#f0f0f0' : 'white' }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Thông điệp của bạn:</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="4"
                            maxLength="280"
                            placeholder="(Dưới 280 ký tự)"
                            required
                        ></textarea>
                    </div>

                <button type="submit" className="submit-button">Gửi</button>
                </form>
            </div>
        </div>
    );
};

export default MessageModal;