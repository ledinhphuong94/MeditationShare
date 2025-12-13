import React, {useState, useEffect, useRef} from 'react';
import * as helper from "../../common/helper.js";
import './MessageModal.css';
import { useUser } from '../../UserContext.js';
import { useTranslation } from "react-i18next";

const MessageModal = ({ formData, isOpen, onClose, onSubmit }) => {
    const { userInfo } = useUser();
    const { username } = userInfo;
    const { t } = useTranslation();
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
                alert(t("messageModal.not_allow_link_in_name"))
                return;
            };
            if (helper.containsProfanity(currentName.trim())) {
                alert(t("messageModal.not_valid_name"))
                return;
            };
            if (helper.containsForbiddenContent(currentMessage.trim())) {
                alert(t("messageModal.not_allow_link_in_message"))
                return;
            };
            if (helper.containsProfanity(currentMessage.trim())) {
                alert(t("messageModal.not_valid_message"))
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
            alert(t("messageModal.please_fill_both"));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                
                <button className="close-button" onClick={onClose}>&times;</button>
                
                <h2>{t("messageModal.message_to_the_world")}</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">{t("messageModal.label_name")}</label>
                        <input
                            id="name"
                            type="text"
                            ref={nameRef}
                            defaultValue={name}
                            placeholder={t("messageModal.place_holder_name")}
                            disabled={!!formData} 
                            required
                            style={{ backgroundColor: !!formData ? '#f0f0f0' : 'white' }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">{t("messageModal.label_your_mess")}</label>
                        <textarea
                            id="message"
                            ref={messageRef}
                            defaultValue={message}
                            rows="4"
                            maxLength="280"
                            placeholder={t("messageModal.place_holder_mess")}
                            required
                        ></textarea>
                    </div>

                <button type="submit" className="submit-button">{t("messageModal.send")}</button>
                </form>
            </div>
        </div>
    );
};

export default MessageModal;