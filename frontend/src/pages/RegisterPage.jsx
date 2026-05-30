import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';

const isEmail  = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isMobile = v => /^[0-9]{10}$/.test(v);

const ROLES = ['buyer', 'vendor', 'admin'];

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate     = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', role: 'buyer' });
    const [showPw, setShowPw]   = useState(false);
    const [errors, setErrors]   = useState({});
    const [loading, setLoading] = useState(false);
    const [apiErr, setApiErr]   = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email && !form.mobile) { e.email = 'Provide email or mobile'; e.mobile = ' '; }
        if (form.email  && !isEmail(form.email))   e.email  = 'Invalid email';
        if (form.mobile && !isMobile(form.mobile)) e.mobile = 'Must be 10 digits';
        if (!form.password) e.password = 'Password is required';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiErr('');
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length) return;

        const payload = { name: form.name.trim(), password: form.password, role: form.role };
        if (form.email)  payload.email  = form.email.trim();
        if (form.mobile) payload.mobile = form.mobile.trim();

        setLoading(true);
        try {
            await register(payload);
            navigate('/dashboard');
        } catch (err) {
            setApiErr(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create account</h1>
                    <p>Join KOMA today</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label htmlFor="name">Full name</label>
                        <input id="name" type="text" placeholder="Your name"
                            value={form.name} onChange={e => set('name', e.target.value)}
                            autoComplete="name" />
                        {errors.name && <span className="field-err">{errors.name}</span>}
                    </div>

                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="email">Email <span className="optional">optional</span></label>
                            <input id="email" type="email" placeholder="you@email.com"
                                value={form.email} onChange={e => set('email', e.target.value)}
                                autoComplete="email" />
                            {errors.email && <span className="field-err">{errors.email}</span>}
                        </div>
                        <div className="field">
                            <label htmlFor="mobile">Mobile <span className="optional">optional</span></label>
                            <input id="mobile" type="tel" placeholder="10 digits" maxLength={10}
                                value={form.mobile} onChange={e => set('mobile', e.target.value)}
                                autoComplete="tel" />
                            {errors.mobile && <span className="field-err">{errors.mobile}</span>}
                        </div>
                    </div>

                    <div className="field">
                        <label>Role</label>
                        <div className="role-selector">
                            {ROLES.map(r => (
                                <button key={r} type="button"
                                    className={`role-btn${form.role === r ? ' active' : ''}`}
                                    onClick={() => set('role', r)}>
                                    {r === 'buyer' ? '🛒' : r === 'vendor' ? '🏪' : '🛡'} {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="reg-password">Password</label>
                        <div className="input-icon-right">
                            <input id="reg-password" type={showPw ? 'text' : 'password'}
                                placeholder="••••••••" value={form.password}
                                onChange={e => set('password', e.target.value)}
                                autoComplete="new-password" />
                            <button type="button" className="icon-btn" onClick={() => setShowPw(p => !p)}
                                aria-label="Toggle password">
                                {showPw ? '🙈' : '👁'}
                            </button>
                        </div>
                        {errors.password && <span className="field-err">{errors.password}</span>}
                    </div>

                    {apiErr && <p className="form-error">{apiErr}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Create account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
