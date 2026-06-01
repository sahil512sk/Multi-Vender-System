import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleBadge = { buyer: '#2563eb', vendor: '#7c3aed', admin: '#dc2626' };

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">KOMA</Link>
            <div className="navbar-right">
                {user ? (
                    <>
                        <span className="role-badge" style={{ background: roleBadge[user.role] }}>
                            {user.role}
                        </span>
                        <span className="navbar-name">{user.name}</span>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        <button className="btn-ghost" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login"    className="nav-link">Sign in</Link>
                        <Link to="/register" className="btn-primary-sm">Get started</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
