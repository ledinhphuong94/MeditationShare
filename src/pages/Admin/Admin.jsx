import './Admin.css';
import React, { useState, useEffect } from 'react';
import { GiPositionMarker } from "react-icons/gi";


const Admin = () => {
    let [imgUrl, setImgUrl] = useState('')
    let [file, setFile] = useState('')
    console.log('Admin Page')
    const handleChange = (e) => {
        setFile(e.target.files[0]); // lấy file đầu tiên
    };

    const handleUpload = async () => {
        if (!file) return alert("Chưa chọn file");

        const formData = new FormData();
        formData.append("avatar", file); 
        // "file" là key – backend sẽ đọc theo key này

        try {
            const res = await fetch("http://localhost:3333/api/users/upload-avatar-local", {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMSwiaWF0IjoxNzY2NTA0NzcxLCJleHAiOjE3NjY1OTExNzF9.gKjf2D8BBIG9H_l9pJPd7ObcYGu10LVED-N-pO4F8v0`, // optional
                },
            });

            const data = await res.json();
            const url = data.data.filename;
            setImgUrl(`http://localhost:3333/upload/${url}`)
            console.log(data);
            
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadCloud = async () => {

    }

    return (
        <>
            <h2>Admin Page</h2>
            <div>
                <div>Avatar</div>
                <input type="file" onChange={handleChange} />
                <button onClick={handleUpload}>Upload local</button>
                <button onClick={handleUploadCloud}>Upload cloud</button>
                <img width={300} height={300} alt='' src={imgUrl}/>
            </div>
        </>

  );
};

export default Admin;
