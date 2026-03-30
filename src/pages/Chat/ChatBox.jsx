import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '../../UserContext.js';
import defaultAvatar from "../../img/sunrise.jpg";
function ChatBox({ socket, currentGroupId }) {
    const { userInfo } = useUser();
    const [messagesData, setMessagesData] = useState([]);
    const [value, setValue] = useState('');
    const pageSize = 10;
    const scrollContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const isAtTopRef = useRef(false);
    const [isLoadingMess, setIsLoadingMess] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);

    const [savedHeight, setSavedHeight] = useState(0); // Để xử lý nhảy scroll
    const [isFetchingOld, setIsFetchingOld] = useState(false);

    const loadMessages = async (groupId, currPage, pageSize) => {
        console.log('>> user info', userInfo.userId)
        console.log("Loading messages... currentGroupId", groupId);
        const container = scrollContainerRef.current;
        setIsLoadingMess(true);
        // Lưu lại chiều cao trước khi thêm tin nhắn mới
        setSavedHeight(container.scrollHeight);
        setIsFetchingOld(true);
        try {
            return new Promise(async (resolve, reject) => {
                const result = await fetch(`http://localhost:3333/api/chats/${groupId}/messages?page=${currPage}&pageSize=${pageSize}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access-token-local-server")}`, // Lấy token từ localStorage
                    },
                });
               
                const data = await result.json();
                const {totalRow, page, totalPage, messages} = data.data;
                setTotalPage(totalPage);
                setCurrentPage(page);
                console.log("Fetched messages:", messages);
                messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                resolve(messages);
                setIsLoadingMess(false);
            })
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const clearInput = () => {
        setValue('');
    };

    const sendMessage = (currentGroupId) => {
        const messageText = document.querySelector('.chat-input input').value;
        if (messageText.trim() === "") return;
        if (socket && socket.connected && currentGroupId) {
            socket.emit("send_message", { 
                groupId: currentGroupId, 
                messageText, 
                accessToken: localStorage.getItem("access-token-local-server") 
            }, (res) => {
                // Sau khi gửi thành công, tải lại tin nhắn
                clearInput();
                
            });
        } else {
            console.error("Socket is not connected or null, or no group selected");
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    const handleScroll = async () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        // Tính toán khoảng cách từ vị trí hiện tại đến đáy
        const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        
        // Nếu khoảng cách nhỏ hơn 100px thì coi như đang ở đáy
        isAtBottomRef.current = distanceToBottom < 100;
        isAtTopRef.current = container.scrollTop < 20;

        if (isAtTopRef.current && !isLoadingMess && currentPage < totalPage) {
            const mess = await loadMessages(currentGroupId, currentPage + 1, pageSize);
            if (mess) setMessagesData((prev) => [...mess, ...prev]);
        }

        console.log('Is bottom', isAtBottomRef.current)
        console.log('Is Top', isAtTopRef.current)
    };

    useEffect(() => {
        const enterlistener = (e) => {
            if (e.key === 'Enter') {
                sendMessage(currentGroupId);
            }
        };
        document.addEventListener('keyup', enterlistener);
        return () => {
            document.removeEventListener('keyup', enterlistener);
        };
    }, [currentGroupId]);

    useEffect(() => {
        if (socket) {
            socket.on('newMessage', (data) => {
                if (data.groupId === currentGroupId) {
                     setMessagesData((prevMess) => [...prevMess, data]);
                }
            });
        }

        // Cleanup khi component unmount
        return () => {
            if (socket) {
                socket.off("newMessage");
            }
        };
    }, [socket, currentGroupId]);

    useEffect(() => {
        if (currentGroupId) {
            loadMessages(currentGroupId, currentPage, pageSize).then(message => {
                if (message) setMessagesData([...message]);
            });
        }
    }, [currentGroupId]);

    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollToBottom();
        };
        const container = scrollContainerRef.current;
        if (isFetchingOld && container) {
            // Vị trí mới = Chiều cao mới - Chiều cao cũ
            container.scrollTop = container.scrollHeight - savedHeight;
            setIsFetchingOld(false);
        } else if (isAtBottomRef.current) {
            // Nếu đang ở đáy thì mới auto-scroll xuống
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messagesData]);

    return (
        <div className="chat-box">
            <h4 style={{textAlign: 'center'}}>Chat Box!</h4>
            {isLoadingMess ? <div>...Loading</div> : (
                <div 
                    className="chat-messages"
                    onScroll={handleScroll}
                    ref={scrollContainerRef}
                >
                    {messagesData.map((message) => (
                        <div key={message.id} className="message" who={message.ownerId === userInfo.userId ? "you" : ""}>
                            <div className='message-content-wrap'>
                                <div className="message-sender">
                                    <img src={message.senderInfo.avatar || defaultAvatar} alt="Avatar" />
                                    <strong>{message.senderInfo.full_name}</strong>
                                </div>
                                <div>{message.messageText}</div>
                                <small>{new Date(message.createdAt).toLocaleString()}</small>
                            </div>
                        </div>
                    ))}
                    {/* Messages will be displayed here */}
                    <div ref={messagesEndRef} />
                </div>
            )}
            
            <div className="chat-input">
                <input type="text" placeholder="Type a message..." value={value} onChange={(e) => setValue(e.target.value)} />
                <button style={{cursor: 'pointer'}} onClick={() => sendMessage(currentGroupId)}>Send</button>
            </div>
            
        </div>
        
    );
}

export default ChatBox;