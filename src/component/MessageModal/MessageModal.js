import React, {useState, useEffect} from 'react';
import './MessageModal.css';

const MessageModal = ({ username, isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState(username);
    const [message, setMessage] = useState('');
    useEffect(() => {
        setName(username);
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey)
        }
    }, [username, isOpen, onClose]);
    // Nếu modal không mở thì không render gì cả
    if (!isOpen) return null;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && message.trim()) {
            // Gọi hàm onSubmit từ component cha, truyền dữ liệu
            onSubmit({ name, message });
            
            // Reset form và đóng modal
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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Thông điệp của bạn:</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="4"
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