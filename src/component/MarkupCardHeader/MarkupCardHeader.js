import './MarkupCardHeader.css';

export default function MarkupCardHeader({ totalUsers }) {
    return (
        <>
            <div className='markup-header'>
                <h2 className='markup-title'>Bản đồ ánh sáng</h2>
                <div className="markup-title-description">Chạm vào bản đồ để thắp nến</div>
                <p className='total-users'>{totalUsers} nguời đã thắp nến</p>
            </div>
        </>
    
    );
}


