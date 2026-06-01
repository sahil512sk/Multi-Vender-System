import { useAuth } from '../src/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const roleColor = { buyer: '#2563eb', vendor: '#7c3aed', admin: '#dc2626' };
const roleIcon  = { buyer: '🛒', vendor: '🏪', admin: '🛡' };

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    if (!user) return null;

    return (
        <div className="dashboard">
            <div className="dash-hero">
                <div className="dash-avatar" style={{ background: roleColor[user.role] }}>
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 className="dash-name">{user.name}</h1>
                    <span className="role-badge-lg" style={{ background: roleColor[user.role] }}>
                        {roleIcon[user.role]} {user.role}
                    </span>
                </div>
            </div>

            <div className="dash-cards">
                <div className="info-card">
                    <p className="info-label">User ID</p>
                    <p className="info-value mono">{user.id || user._id}</p>
                </div>
                <div className="info-card">
                    <p className="info-label">Email</p>
                    <p className="info-value">{user.email || '—'}</p>
                </div>
                <div className="info-card">
                    <p className="info-label">Mobile</p>
                    <p className="info-value">{user.mobile || '—'}</p>
                </div>
                <div className="info-card">
                    <p className="info-label">Status</p>
                    <p className="info-value">
                        <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                    </p>
                </div>
                {user.createdAt && (
                    <div className="info-card">
                        <p className="info-label">Member since</p>
                        <p className="info-value">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                )}
            </div>

            <div className="dash-actions">
                <button className="btn-danger-outline" onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
};

export default DashboardPage;
