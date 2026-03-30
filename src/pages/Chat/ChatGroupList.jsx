import React, { useState, useEffect, useRef } from 'react';
import {useUser} from '../../UserContext.js';
function ChatGroupList({ socket, onClickRoom, newGroup }) {
    const { userInfo } = useUser();
    const [chatGroups, setChatGroups] = useState([]);
    const hasFetched = useRef(false); // Flag để tránh fetch nhiều lần
    
    function joinRoom(groupId) {
        console.log("Open chat box for group", socket, socket.id, socket.room);
        if (socket && socket.connected) {
            socket.emit("start_chat", { groupId, accessToken: localStorage.getItem("access-token-local-server") }, (res) => {
                console.log(res);
                if (onClickRoom) onClickRoom(groupId);
            });
        } else {
            console.error("Socket is not connected or null");
        }
    };

    function processSelect(groupId) {
        console.log("Select group:", groupId);
        document.querySelectorAll('.chat-groups li').forEach(li => {
            li.classList.remove('selected');
        });
        document.querySelector(`.chat-groups li[group-data='${groupId}']`).classList.add('selected');
    };

    const processNewGroup = (newGroup) => {
        console.log("New group detected in ChatGroupList:", newGroup);
        const isPrivateGroup = newGroup.chatMembers.length === 2;
        if (isPrivateGroup) {
            const otherMem = newGroup.chatMembers.filter(g => g.user.user_id !== userInfo.userId);
            let otherMemName;
            if (otherMem.length === 0) {
                otherMemName = newGroup.chatMembers[0].user.full_name;
            } else {
                otherMemName = otherMem[0].user.full_name;
            }
            newGroup.groupName = otherMemName;
        };
        if (chatGroups.findIndex((gr) => gr.id === newGroup.id) === -1) {
            setChatGroups((prevGroups) => [newGroup, ...prevGroups]);
        }
    };
    
    useEffect( () => {
        // Khi click vào từng user hoặc tạo group chat
        if (newGroup) {
            processNewGroup(newGroup);
        }
        return () => {}
    }, [newGroup])

    useEffect( () => {
        if (hasFetched.current) return; // Nếu đã fetch rồi, bỏ qua
        console.log("Fetching chat groups list...");
        hasFetched.current = true; // Đánh dấu đã fetch

        async function fetchChatGroups() {
            try {
                const result = await fetch("http://localhost:3333/api/chats/groups?page=1&pageSize=10", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access-token-local-server")}`, // Lấy token từ localStorage
                    },
                });
                const data = await result.json();
                console.log('hasFetched.current', hasFetched.current)
                if (hasFetched.current) { // Chỉ set state nếu component còn mount
                    const chatGroups = data.data.data;
                    const updatedGroups = chatGroups.map((group) => {
                        const isPrivateGroup = group.chatMembers.length === 2;
                        if (isPrivateGroup) {
                            const otherMem = group.chatMembers.filter(g => g.user.user_id !== userInfo.userId);
                            let otherMemName = group.groupName;
                            if (otherMem.length === 0) {
                                otherMemName = group.chatMembers[0].user.full_name;
                            } else {
                                otherMemName = otherMem[0].user.full_name;
                            }
                            group.groupName = otherMemName;
                         
                        }
                        return {...group}
                    })
                    console.log("Fetched chat groups:", updatedGroups);
                    setChatGroups(updatedGroups);
                }
            } catch (error) {
                console.error("Error fetching chat groups:", error);
                hasFetched.current = false; // Reset flag nếu lỗi, cho phép retry
            }
        };
        fetchChatGroups();

        return () => {
            hasFetched.current = false; // Cleanup khi component unmount
        };
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on("noti", (res) => {
                console.log('Personal notification', res.data);

                // Move room to top when new mess
                if (res.type === "new_message") {
                    let groupId = res.data.groupId;
                    setChatGroups((prevGroups) => {
                        const otherChat = prevGroups.filter((group) => group.id !== groupId);
                        let thisGroup = prevGroups.filter((group) => group.id === groupId);
                        if (thisGroup.length === 0) {
                            thisGroup = [res.data.groupChats]
                        }
                        return [...thisGroup, ...otherChat]
                    });
                };

                // Add new group to Top when having new group
                if (res.type === "new_group") {
                    // Nhận được Noti khi người khác tạo room
                    processNewGroup(res.data);
                }    
            });
        }
        
        return () => {
            if (socket) {
                socket.off("noti");
            }
        };
    }, [socket])

    return (
        <div className="chat-groups">
            <h4 style={{textAlign: 'center'}}>Chat Groups!</h4>
            <ul>
                {chatGroups.map((group) => (
                    <li 
                        group-data={group.id}
                        onClick={() => {
                            joinRoom(group.id);
                            processSelect(group.id);
                        }}
                        key={group.id}
                        style={{border: "1px solid gray", cursor: 'pointer', margin: '10px', padding: '10px'}}
                    >
                        <strong>{group.groupName} - ID: {group.id}</strong>
                    </li>
                ))}
            </ul> 
        </div>
        
    );
}

export default ChatGroupList;