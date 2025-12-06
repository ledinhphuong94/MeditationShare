import React, {useState, useEffect, useRef} from 'react';
import * as helper from "../../common/helper.js";
import './MessageModal.css';
import { useUser } from '../../UserContext.js';

const MessageModal = ({ formData, isOpen, onClose, onSubmit }) => {
    const { userInfo } = useUser();
    const { username } = userInfo;

    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const nameRef = useRef(null);
    const messageRef = useRef(null);
    const formId = formData ? formData.id : null;
    const prevIsOpenRef = useRef(false);
    const prevFormIdRef = useRef(formId);

    useEffect(() => {
        const opening = isOpen && !prevIsOpenRef.current;
        const editingDifferent = isOpen && formId !== prevFormIdRef.current;

        if (opening || editingDifferent) {
            let defaultName = username === 'Anonymous' ? '' : username;
            const initialName = formData ? formData.name : (defaultName || window.localStorage.getItem("meditation_user_name"));
            const initialMessage = formData ? formData.message : '';
            setName(initialName);
            setMessage(initialMessage);
            if (nameRef.current) nameRef.current.value = initialName;
            if (messageRef.current) messageRef.current.value = initialMessage;
            prevFormIdRef.current = formId;
        }

        prevIsOpenRef.current = isOpen;

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    // Re-run when modal open state or the current editing id changes
    }, [isOpen, formId, username, onClose, formData]);
    // Nếu modal không mở thì không render gì cả
    if (!isOpen) return null;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const currentName = nameRef.current ? nameRef.current.value : name;
        const currentMessage = messageRef.current ? messageRef.current.value : message;
        if (currentName.trim() && currentMessage.trim()) {
            // Kiểm tra xem có link lạ không?
            if (helper.containsForbiddenContent(currentName.trim())) {
                alert("Tên không được phép chứa đường dẫn!")
                return;
            };
            if (helper.containsProfanity(currentName.trim())) {
                alert("Tên không hợp lệ!")
                return;
            };
            if (helper.containsForbiddenContent(currentMessage.trim())) {
                alert("Thông điệp không được chứa đường dẫn!")
                return;
            };
            if (helper.containsProfanity(currentMessage.trim())) {
                alert("Thông điệp không hợp lệ!")
                return;
            };
            // Gọi hàm onSubmit từ component cha, truyền dữ liệu
            onSubmit({ name: currentName, message: currentMessage, messId: formData ? formData.id : 0, isEdited: !!formData });

            // Reset uncontrolled inputs and local state, then close
            if (nameRef.current) nameRef.current.value = '';
            if (messageRef.current) messageRef.current.value = '';
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
                            ref={nameRef}
                            defaultValue={name}
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
                            ref={messageRef}
                            defaultValue={message}
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