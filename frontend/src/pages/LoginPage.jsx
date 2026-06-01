import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';

const isEmail  = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isMobile = v => /^[0-9]{10}$/.test(v);

const LoginPage = () => {
    const { login } = useAuth();
    const navigate  = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password,   setPassword]   = useState('');
    const [showPw,     setShowPw]     = useState(false);
    const [error,      setError]      = useState('');
    const [loading,    setLoading]    = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isEmail(identifier) && !isMobile(identifier)) {
            return setError('Enter a valid email or 10-digit mobile number');
        }
        if (!password) return setError('Password is required');

        const payload = { password };
        if (isEmail(identifier))  payload.email  = identifier;
        else                      payload.mobile = identifier;

        setLoading(true);
        try {
            await login(payload);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome back</h1>
                    <p>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label htmlFor="identifier">Email or mobile</label>
                        <input
                            id="identifier"
                            type="text"
                            placeholder="you@email.com or 9876543210"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            autoComplete="username"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <div className="input-icon-right">
                            <input
                                id="password"
                                type={showPw ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <button type="button" className="icon-btn" onClick={() => setShowPw(p => !p)}
                                aria-label={showPw ? 'Hide password' : 'Show password'}>
                                {showPw ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    {error && <p className="form-error">{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Sign in'}
                    </button>
                </form>

                <p className="auth-footer">
                    No account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
