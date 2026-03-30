import React, { useState, useEffect } from 'react';

function UsersList({ socket, onClickUser }) {
    const [users, setUsers] = useState([]);
    const openChatWithUser = (event, userId) => {
        event.preventDefault()
        console.log("Open chat with user:", userId);
        console.log("Using socket:", socket);
        if (socket && socket.connected) {
            socket.emit("open_chat", { userList: [userId], accessToken: localStorage.getItem("access-token-local-server") }, (res) => {
                console.log('resss', res)
                onClickUser(res.groupData)
            }); 
        } else {
            console.error("Socket is not connected or null");
        }
    };

    const getAllSelectedUsers = () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        console.log("checkboxes", checkboxes)
        let groupName = document.querySelector("#group_name").value;
        const selectedUserIds = Array.from(checkboxes).map(checkbox => {
            const liElement = checkbox.closest('li');
            return liElement ? parseInt(liElement.getAttribute('data-user-id')) : null;
        }).filter(id => id !== null);
        console.log("Selected user IDs for group chat:", selectedUserIds);
        if (selectedUserIds.length < 2) {
            alert("Group chat must have more than 2 person!")
            return;
        }
        if (socket && socket.connected) {
            socket.emit("open_chat", { userList: selectedUserIds, accessToken: localStorage.getItem("access-token-local-server"), groupName: groupName }, (res) => {
                console.log('resss', res)
                onClickUser(res.groupData)
            }); 
        } else {
            console.error("Socket is not connected or null");
        }
    };

    useEffect( () => {
        console.log("Fetching users list...");
        let isMounted = true; // Flag để kiểm tra component còn mount không

        async function fetchChats() {
            try {
                const result = await fetch("http://localhost:3333/api/users", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access-token-local-server")}`, // Lấy token từ localStorage
                    },
                });

                const data = await result.json();
                console.log('>>> data', data)
                if (data.statusCode === 401) {
                    throw new Error(data.message);
                }
                if (isMounted) { // Chỉ set state nếu component còn mount
                    const users = data.data;
                    console.log("Fetched users:", users);
                    if (users) setUsers(users);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchChats();

        return () => {
            isMounted = false; // Cleanup khi component unmount
        };
    }, []);

    return (
        <div className="chat-user-list">
            <h4 style={{textAlign: 'center'}}>User List!</h4>
            <button onClick={getAllSelectedUsers}>Create group</button>
            <form>
                <input id="group_name" placeholder='Group name' />
                <ul>
                    {users.map((user) => (
                        <li 
                            data-user-id={user.user_id}
                            key={user.user_id}
                            style={{ padding: '8px', border: '1px solid #ccc', marginBottom: '4px' }}
                        >
                            <div>
                                <b>{user.full_name}</b> ({user.email})
                                <input type="checkbox" />
                            </div>

                            <button style={{cursor: 'pointer'}} onClick={(event) => openChatWithUser(event, user.user_id)}>Chat</button>
                        </li>
                    ))}
                </ul>
            </form>
        </div>
        
    );
}

export default UsersList;