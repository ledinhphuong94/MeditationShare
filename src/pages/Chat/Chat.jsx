import "./Chat.css";
import { io } from "socket.io-client";
import React, { useEffect, useState } from 'react';
import ChatBox from "./ChatBox.jsx";
import ChatGroupList from "./ChatGroupList.jsx";
import UsersList from "./UsersList.jsx";
import { useNavigate } from 'react-router-dom'; // Thêm useNavigate để điều hướng
import {useUser} from '../../UserContext.js';

function Chat() {
    const { userInfo } = useUser();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [currentGroupId, setCurrentGroupId] = useState(null); 
    const [newGroup, setNewGroup] = useState(null); 
    const onClickRoom = (groupId) => {
        console.log('>>> click room:', groupId)
        setCurrentGroupId(groupId);
    };

    const onClickUser = (groupData) => {
        setNewGroup(groupData);
    };

    useEffect(() => {
        console.log("Chat Page Loaded");
        const newSocket = io("http://localhost:3333", {
            auth: {
                token: localStorage.getItem("access-token-local-server")
            }
        });
        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id); 
        });
        newSocket.on("connect_error", (err) => {
            console.log(err);
            alert(err.message)
            navigate("/login")
        })
        setSocket(newSocket);
        // Cleanup khi component unmount
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <>
            <div style={{margin: "10px"}}>Welcome <b>{userInfo.username}</b></div>
            <div className="chat-container">
                <UsersList socket={socket} onClickUser={onClickUser} />
                <ChatGroupList socket={socket} onClickRoom={onClickRoom} newGroup={newGroup}/>
                <ChatBox socket={socket} currentGroupId={currentGroupId} />
            </div>
        </>
        
    );
}

export default Chat;