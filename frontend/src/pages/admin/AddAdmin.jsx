import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { createAdminUser } from '../../api/api';
import { sendOTP, verifyOTP } from '../../api/api';
import {
  IconUserPlus, IconMail, IconBriefcase, IconShieldUser,
  IconUsers, IconChevronRight, IconPhone,
  IconMessageCircle, IconCheckCircle, IconSend,
} from '../../components/common/Icons';

const DEPARTMENTS = [
  "Administration", "IT & Systems", "Facilities Management",
  "Academic Affairs", "Finance", "Human Resources",
  "Security", "Student Services", "Research", "Other",
];

const EMPTY = {
  name: '', email: '', password: '', confirmPassword: '',
  jobTitle: '', department: '', includeStaff: false,
};

export default function AddAdmin() {
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [created, setCreated]     = useState(null);

  // WhatsApp OTP state
  const [waPhone,      setWaPhone]      = useState('');
  const [waVerified,   setWaVerified]   = useState(false);
  const [waSending,    setWaSending]    = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput,     setOtpInput]     = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError,     setOtpError]     = useState('');

  const formatPhone = (raw) => {
    // keep digits only, max 10
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`;
    return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`;
  };

  const handlePhoneInput = (raw) => {
    setWaPhone(formatPhone(raw));
    setWaVerified(false);
  };

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSendOTP = async () => {
    if (!waPhone.trim()) { showToast('Enter a WhatsApp number first.', false); return; }
    setWaSending(true);
    try {
      await sendOTP(waPhone.replace(/\s/g, ''));
      setShowOtpModal(true);
      setOtpInput('');
      setOtpError('');
    } catch {
      showToast('Failed to send OTP. Check the number and try again.', false);
    } finally {
      setWaSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 6) { setOtpError('Enter the 6-digit OTP.'); return; }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await verifyOTP(waPhone.replace(/\s/g, ''), otpInput);
      if (res.data.success) {
        setWaVerified(true);
        setShowOtpModal(false);
        showToast('WhatsApp number verified!');
      } else {
        setOtpError(res.data.error || 'Invalid OTP. Try again.');
      }
    } catch {
      setOtpError('Verification failed. Try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const validate = () => {
    if (!form.name.trim())  return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { showToast(err, false); return; }

    setSaving(true);
    try {
      await createAdminUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        jobTitle: form.jobTitle.trim(),
        department: form.department,
        includeStaff: form.includeStaff,
      });
      setCreated({ name: form.name, email: form.email });
      setForm(EMPTY);
      showToast(`Admin account created for ${form.name}!`);
      setTimeout(() => setCreated(null), 5000);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create admin.', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Add Administrator">
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:72, right:24, zIndex:999, padding:'12px 20px', borderRadius:10, fontWeight:600, fontSize:14, background: toast.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`, color: toast.ok?'#15803d':'#dc2626', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header Banner */}
        <div style={{ background:'linear-gradient(135deg,#4f6fff 0%,#00e5c3 100%)', borderRadius:16, padding:'24px 28px', marginBottom:24, display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <IconUserPlus size={28} style={{ color:'#fff' }}/>
          </div>
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.3px' }}>Create Admin Account</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.85)', margin:0 }}>
              New admin will have full system access. Credentials are sent manually.
            </p>
          </div>
        </div>

        {/* Success card */}
        {created && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:20 }}>✓</span>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#15803d' }}>Admin created successfully!</div>
              <div style={{ fontSize:13, color:'#166534', marginTop:2 }}>
                <strong>{created.name}</strong> — <code style={{ background:'#dcfce7', padding:'1px 6px', borderRadius:4 }}>{created.email}</code>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <FormCard icon={IconUserPlus} title="Personal Information" desc="Basic identity of the new admin">
            <div style={grid2}>
              <Field label="Full Name" required>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. John Smith" style={input} required/>
              </Field>
              <Field label="Email Address" required>
                <div style={{ position:'relative' }}>
                  <IconMail size={14} style={iconInInput}/>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@smartcampus.com" style={{ ...input, paddingLeft:32 }} required/>
                </div>
              </Field>
            </div>
          </FormCard>

          {/* WhatsApp Verification */}
          <FormCard icon={IconPhone} title="WhatsApp Verification" desc="Send an OTP to verify the admin's WhatsApp number">
            <div style={{ display:'flex', gap:10, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:200, position:'relative' }}>
                <IconPhone size={14} style={iconInInput}/>
                <input
                  value={waPhone}
                  onChange={e => handlePhoneInput(e.target.value)}
                  placeholder="076 789 3782"
                  maxLength={12}
                  style={{ ...input, paddingLeft:32, letterSpacing:'0.05em', borderColor: waVerified ? '#bbf7d0' : '#e2e8f0' }}
                  disabled={waVerified}
                />
              </div>
              {waVerified ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:9, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d', fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>
                  <IconCheckCircle size={18} style={{ color:'#15803d' }}/> Verified
                  <button type="button" onClick={() => { setWaVerified(false); setWaPhone(''); }}
                    style={{ marginLeft:6, background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    Change
                  </button>
                </div>
              ) : (
                <button type="button" onClick={handleSendOTP} disabled={waSending || !waPhone.trim()}
                  style={{ padding:'10px 18px', borderRadius:9, border:'none', background:'#25D366', color:'#fff', fontWeight:700, fontSize:13, cursor: waSending||!waPhone.trim() ? 'not-allowed':'pointer', opacity: waSending||!waPhone.trim() ? 0.6:1, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:7, fontFamily:'inherit' }}>
                  {waSending ? 'Sending…' : <><IconSend size={14}/> Send OTP</>}
                </button>
              )}
            </div>
          </FormCard>

          {/* Work Details */}
          <FormCard icon={IconBriefcase} title="Work Details" desc="Role and department assignment">
            <div style={grid2}>
              <Field label="Job Title">
                <input value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="e.g. IT Administrator" style={input}/>
              </Field>
              <Field label="Department">
                <select value={form.department} onChange={e => set('department', e.target.value)} style={{ ...input, cursor:'pointer' }}>
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
          </FormCard>

          {/* Permissions */}
          <FormCard icon={IconShieldUser} title="Permissions" desc="Access level for this admin account">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {/* Always-on roles */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['ROLE_ADMIN', 'ROLE_USER'].map(r => (
                  <span key={r} style={{ fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:20, background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe' }}>
                    ✓ {r.replace('ROLE_','')}
                  </span>
                ))}
              </div>
              {/* Optional STAFF role */}
              <label style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#f8fafc', border:`2px solid ${form.includeStaff?'#4f6fff':'#e2e8f0'}`, borderRadius:10, cursor:'pointer', transition:'all 0.15s' }}>
                <input
                  type="checkbox"
                  checked={form.includeStaff}
                  onChange={e => set('includeStaff', e.target.checked)}
                  style={{ width:16, height:16, accentColor:'#4f6fff', cursor:'pointer' }}
                />
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Include STAFF role</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>Allows managing incidents and resources directly</div>
                </div>
              </label>
            </div>
          </FormCard>

          {/* Password */}
          <FormCard icon={IconUsers} title="Set Password" desc="Minimum 6 characters. Share securely with the new admin.">
            <div style={grid2}>
              <Field label="Password" required>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...input, paddingRight:60 }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={showBtn}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.password && (
                  <PasswordStrength password={form.password}/>
                )}
              </Field>
              <Field label="Confirm Password" required>
                <div style={{ position:'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    style={{ ...input, paddingRight:60, borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#fecaca' : '#e2e8f0' }}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={showBtn}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p style={{ fontSize:11, color:'#dc2626', margin:'4px 0 0' }}>Passwords do not match</p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p style={{ fontSize:11, color:'#059669', margin:'4px 0 0' }}>✓ Passwords match</p>
                )}
              </Field>
            </div>
          </FormCard>

          {/* Submit */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
            <button type="button" onClick={() => setForm(EMPTY)} style={cancelBtn}>
              Clear Form
            </button>
            <button type="submit" disabled={saving} style={{ ...submitBtn, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Creating...' : (
                <>
                  Create Admin Account
                  <IconChevronRight size={16}/>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:'32px 28px', maxWidth:380, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', border:'1px solid #e2e8f0', textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <IconMessageCircle size={28} style={{ color:'#15803d' }}/>
            </div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:'0 0 6px' }}>Enter OTP</h3>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 20px', lineHeight:1.5 }}>
              A 6-digit code was sent to <strong>{waPhone}</strong> via WhatsApp.
            </p>
            <input
              value={otpInput}
              onChange={e => { setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6)); setOtpError(''); }}
              placeholder="000000"
              maxLength={6}
              style={{ ...input, textAlign:'center', fontSize:24, fontWeight:800, letterSpacing:'0.3em', marginBottom:8 }}
              autoFocus
            />
            {otpError && <p style={{ fontSize:12, color:'#dc2626', margin:'0 0 12px', fontWeight:600 }}>{otpError}</p>}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button type="button" onClick={() => setShowOtpModal(false)}
                style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button type="button" onClick={handleVerifyOTP} disabled={otpVerifying || otpInput.length !== 6}
                style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#4f6fff,#00e5c3)', color:'#fff', fontSize:14, fontWeight:700, cursor: otpVerifying||otpInput.length!==6?'not-allowed':'pointer', opacity: otpVerifying||otpInput.length!==6?0.6:1, fontFamily:'inherit' }}>
                {otpVerifying ? 'Verifying…' : 'Verify'}
              </button>
            </div>
            <button type="button" onClick={handleSendOTP} disabled={waSending}
              style={{ marginTop:14, background:'none', border:'none', color:'#4f6fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5, margin:'14px auto 0' }}>
              {waSending ? 'Resending…' : <><IconSend size={12}/> Resend OTP</>}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 6 chars', pass: password.length >= 6 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number',           pass: /\d/.test(password) },
    { label: 'Special char',     pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#dc2626', '#f59e0b', '#f59e0b', '#059669', '#059669'];
  const labels = ['Weak', 'Fair', 'Fair', 'Good', 'Strong'];

  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < score ? colors[score] : '#e2e8f0', transition:'background 0.2s' }}/>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color: colors[score], fontWeight:600 }}>{labels[score]}</span>
        <div style={{ display:'flex', gap:8 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize:10, color: c.pass ? '#059669' : '#94a3b8' }}>
              {c.pass ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FormCard({ icon: Icon, title, desc, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'20px 24px', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, paddingBottom:14, borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ width:38, height:38, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={18} style={{ color:'#4f6fff' }}/>
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{title}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
        {label}{required && <span style={{ color:'#ef4444', marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const grid2 = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 };

const input = {
  width:'100%', padding:'10px 12px', fontSize:14,
  border:'2px solid #e2e8f0', borderRadius:9, outline:'none',
  fontFamily:'inherit', color:'#0f172a', background:'#fff',
  boxSizing:'border-box', transition:'border-color 0.15s',
};

const iconInInput = { position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' };

const showBtn = {
  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
  background:'none', border:'none', color:'#4f6fff', fontSize:12,
  fontWeight:700, cursor:'pointer', fontFamily:'inherit', padding:'2px 4px',
};

const cancelBtn = {
  padding:'10px 20px', borderRadius:9, border:'1px solid #e2e8f0',
  background:'#f8fafc', color:'#475569', fontSize:14, fontWeight:600,
  cursor:'pointer', fontFamily:'inherit',
};

const submitBtn = {
  padding:'11px 24px', borderRadius:9, border:'none',
  background:'linear-gradient(135deg,#4f6fff,#00e5c3)', color:'#fff',
  fontSize:14, fontWeight:700, fontFamily:'inherit',
  display:'flex', alignItems:'center', gap:8,
  boxShadow:'0 4px 12px rgba(79,111,255,0.25)',
};
