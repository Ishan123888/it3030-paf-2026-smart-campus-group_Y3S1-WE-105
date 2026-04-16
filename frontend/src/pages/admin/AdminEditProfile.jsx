import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { getMe, updateMyProfile } from '../../api/api';
import {
  IconUserEdit, IconPhone, IconBriefcase, IconLink,
  IconShieldUser, IconMail, IconMapPin, IconEdit,
} from '../../components/common/Icons';

const DEPARTMENTS = [
  "Administration", "IT & Systems", "Facilities Management",
  "Academic Affairs", "Finance", "Human Resources",
  "Security", "Student Services", "Research", "Other",
];

export default function AdminEditProfile() {
  const { user: authUser, loginWithToken, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [avatarDragging, setAvatarDragging] = useState(false);

  // Phone numbers — up to 4
  const [phones, setPhones] = useState(['', '', '', '']);

  useEffect(() => {
    loadProfile();
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProfile = async () => {
    try {
      const res = await getMe();
      const data = res.data;
      setProfile(data);
      // Parse stored phone numbers (comma-separated)
      const stored = (data.phoneNumbers || '').split(',').map(p => p.trim());
      const padded = [...stored, '', '', '', ''].slice(0, 4);
      setPhones(padded);
    } catch (err) {
      showToast('Failed to load profile', false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (idx, value) => {
    setPhones(prev => { const n = [...prev]; n[idx] = value; return n; });
  };

  const handleAvatarFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2 MB', false); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      handleChange('picture', e.target.result);
      updateUser({ picture: e.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const phoneNumbers = phones.filter(p => p.trim()).join(', ');
      const payload = { ...profile, phoneNumbers };
      const res = await updateMyProfile(payload);
      setProfile(res.data);
      updateUser({ name: res.data.name, picture: res.data.picture });
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save profile', false);
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = profile?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Admin')}&background=4f6fff&color=fff&size=128`;

  const TABS = [
    { id: 'basic',     label: 'Basic Info',    icon: IconUserEdit   },
    { id: 'contact',   label: 'Contact',       icon: IconPhone      },
    { id: 'work',      label: 'Work Details',  icon: IconBriefcase  },
    { id: 'emergency', label: 'Emergency',     icon: IconShieldUser },
  ];

  return (
    <AdminLayout title="Edit Profile">
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:72, right:24, zIndex:999, padding:'12px 20px', borderRadius:10, fontWeight:600, fontSize:14, background: toast.ok?'#f0fdf4':'#fef2f2', border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`, color: toast.ok?'#15803d':'#dc2626', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#64748b' }}>
          <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTop:'3px solid #4f6fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Loading profile...
        </div>
      ) : (
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          {/* Profile Header Card */}
          <div style={{ background:'linear-gradient(135deg,#4f6fff 0%,#00e5c3 100%)', borderRadius:16, padding:'28px 32px', marginBottom:24, display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flexShrink:0 }}
              onDragOver={e => { e.preventDefault(); setAvatarDragging(true); }}
              onDragLeave={() => setAvatarDragging(false)}
              onDrop={e => { e.preventDefault(); setAvatarDragging(false); handleAvatarFile(e.dataTransfer.files[0]); }}
            >
              <img src={avatarSrc} alt="avatar"
                style={{ width:88, height:88, borderRadius:'50%', objectFit:'cover', border: avatarDragging?'3px solid #fff':'3px solid rgba(255,255,255,0.4)', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', transition:'border 0.15s' }}/>
              <label htmlFor="avatar-upload"
                style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.38)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', opacity:0, transition:'opacity 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.opacity=1}
                onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <IconEdit size={18} style={{ color:'#fff' }}/>
                <span style={{ color:'#fff', fontSize:10, fontWeight:700, marginTop:3 }}>Change</span>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => handleAvatarFile(e.target.files[0])}/>
              <div style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', pointerEvents:'none' }}>
                <IconEdit size={13} style={{ color:'#4f6fff' }}/>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.3px' }}>{profile?.name || 'Administrator'}</h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.85)', margin:'0 0 8px' }}>{profile?.jobTitle || 'System Administrator'}</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {(profile?.roles || []).map(r => (
                  <span key={r} style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)' }}>
                    {r.replace('ROLE_','')}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>Member since</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : new Date().toLocaleDateString('en-US', { month:'short', year:'numeric' })}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:20, background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:4 }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 12px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, transition:'all 0.15s', background: active?'#4f6fff':'transparent', color: active?'#fff':'#64748b' }}
                >
                  <Icon size={15}/>
                  <span style={{ display: window.innerWidth < 600 ? 'none' : 'inline' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Card */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'24px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* ── Basic Info ── */}
            {activeTab === 'basic' && (
              <div>
                <SectionHeader icon={IconUserEdit} title="Basic Information" desc="Your name, bio, and profile picture URL"/>
                <div style={grid2}>
                  <Field label="Full Name" required>
                    <input value={profile?.name || ''} onChange={e => handleChange('name', e.target.value)} placeholder="Your full name" style={input}/>
                  </Field>
                  <Field label="Email Address">
                    <input value={profile?.email || ''} disabled style={{ ...input, background:'#f8fafc', color:'#94a3b8', cursor:'not-allowed' }}/>
                    <p style={hint}>Email cannot be changed</p>
                  </Field>

                  <Field label="Bio" span2>
                    <textarea value={profile?.bio || ''} onChange={e => handleChange('bio', e.target.value)} placeholder="Tell us about yourself..." rows={4} style={{ ...input, resize:'vertical' }}/>
                  </Field>
                </div>
              </div>
            )}

            {/* ── Contact ── */}
            {activeTab === 'contact' && (
              <div>
                <SectionHeader icon={IconPhone} title="Contact Information" desc="Up to 4 phone numbers and online presence"/>
                <div style={grid2}>
                  {phones.map((phone, idx) => (
                    <Field key={idx} label={`Phone Number ${idx + 1}${idx === 0 ? ' (Primary)' : ''}`}>
                      <div style={{ position:'relative' }}>
                        <IconPhone size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
                        <input
                          value={phone}
                          onChange={e => handlePhoneChange(idx, e.target.value)}
                          placeholder={idx === 0 ? '+94 77 123 4567' : 'Optional'}
                          style={{ ...input, paddingLeft:32 }}
                        />
                      </div>
                    </Field>
                  ))}
                  <Field label="Website">
                    <div style={{ position:'relative' }}>
                      <IconLink size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
                      <input value={profile?.website || ''} onChange={e => handleChange('website', e.target.value)} placeholder="https://yourwebsite.com" style={{ ...input, paddingLeft:32 }}/>
                    </div>
                  </Field>
                  <Field label="LinkedIn Profile">
                    <div style={{ position:'relative' }}>
                      <IconLink size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
                      <input value={profile?.linkedIn || ''} onChange={e => handleChange('linkedIn', e.target.value)} placeholder="https://linkedin.com/in/yourname" style={{ ...input, paddingLeft:32 }}/>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ── Work Details ── */}
            {activeTab === 'work' && (
              <div>
                <SectionHeader icon={IconBriefcase} title="Work Details" desc="Your role, department, and office information"/>
                <div style={grid2}>
                  <Field label="Job Title">
                    <input value={profile?.jobTitle || ''} onChange={e => handleChange('jobTitle', e.target.value)} placeholder="e.g. System Administrator" style={input}/>
                  </Field>
                  <Field label="Department">
                    <select value={profile?.department || ''} onChange={e => handleChange('department', e.target.value)} style={{ ...input, cursor:'pointer' }}>
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Office Location" span2>
                    <div style={{ position:'relative' }}>
                      <IconMapPin size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
                      <input value={profile?.officeLocation || ''} onChange={e => handleChange('officeLocation', e.target.value)} placeholder="e.g. Block A, Room 201" style={{ ...input, paddingLeft:32 }}/>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ── Emergency ── */}
            {activeTab === 'emergency' && (
              <div>
                <SectionHeader icon={IconShieldUser} title="Emergency Contact" desc="Person to contact in case of emergency"/>
                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#92400e' }}>
                  ⚠️ This information is kept confidential and only used in emergencies.
                </div>
                <div style={grid2}>
                  <Field label="Emergency Contact Name">
                    <input value={profile?.emergencyContact || ''} onChange={e => handleChange('emergencyContact', e.target.value)} placeholder="Full name of contact person" style={input}/>
                  </Field>
                  <Field label="Emergency Contact Phone">
                    <div style={{ position:'relative' }}>
                      <IconPhone size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}/>
                      <input value={profile?.emergencyPhone || ''} onChange={e => handleChange('emergencyPhone', e.target.value)} placeholder="+94 77 123 4567" style={{ ...input, paddingLeft:32 }}/>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:24, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
              <button onClick={loadProfile} style={{ padding:'10px 20px', borderRadius:9, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding:'10px 24px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#4f6fff,#00e5c3)', color:'#fff', fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', opacity:saving?0.7:1, boxShadow:'0 4px 12px rgba(79,111,255,0.25)', display:'flex', alignItems:'center', gap:8 }}
              >
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
            </div>
          </div>

          {/* Account Info Card */}
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'20px 24px', marginTop:16, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Account Information</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
              {[
                { label:'Account Type', value: profile?.provider === 'google' ? '🔵 Google OAuth' : '🔑 Local Account' },
                { label:'Status', value: profile?.active ? '✅ Active' : '❌ Inactive' },
                { label:'Last Login', value: profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : new Date().toLocaleString() },
                { label:'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : new Date().toLocaleDateString() },
              ].map(item => (
                <div key={item.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:16, borderBottom:'1px solid #f1f5f9' }}>
      <div style={{ width:40, height:40, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={20} style={{ color:'#4f6fff' }}/>
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{title}</div>
        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{desc}</div>
      </div>
    </div>
  );
}

function Field({ label, children, required, span2, hint: hintText }) {
  return (
    <div style={{ gridColumn: span2 ? '1 / -1' : undefined }}>
      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
        {label}{required && <span style={{ color:'#ef4444', marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const hint = { fontSize:11, color:'#94a3b8', margin:'4px 0 0', lineHeight:1.4 };

const grid2 = {
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',
  gap:16,
};

const input = {
  width:'100%', padding:'10px 12px', fontSize:14,
  border:'2px solid #e2e8f0', borderRadius:9, outline:'none',
  fontFamily:'inherit', color:'#0f172a', background:'#fff',
  boxSizing:'border-box', transition:'border-color 0.15s',
};
