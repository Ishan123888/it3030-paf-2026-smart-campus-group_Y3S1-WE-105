import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBooking, getMyBookings, getResourceById, rescheduleBooking } from '../api/api';
import BackgroundSlideshow, { toImgurDirect } from '../components/common/BackgroundSlideshow';

const DASH_BG = [toImgurDirect('https://imgur.com/t4yWwhI')];

export default function StudentBookingFormPage() {
  const navigate = useNavigate();
  const { resourceId, bookingId } = useParams();
  const isReschedule = Boolean(bookingId);
  const [resource, setResource] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    resourceId: resourceId || '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isReschedule) {
          const bookingsRes = await getMyBookings();
          const currentBooking = (bookingsRes.data || []).find(item => item.id === bookingId);
          if (!currentBooking) throw new Error('Booking not found.');
          setBooking(currentBooking);
          setForm({
            resourceId: currentBooking.resourceId,
            bookingDate: currentBooking.bookingDate,
            startTime: currentBooking.startTime,
            endTime: currentBooking.endTime,
            purpose: currentBooking.purpose,
            expectedAttendees: currentBooking.expectedAttendees,
          });
          const resourceRes = await getResourceById(currentBooking.resourceId);
          setResource(resourceRes.data);
        } else {
          const resourceRes = await getResourceById(resourceId);
          setResource(resourceRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load booking form.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId, isReschedule, resourceId]);

  const availabilityText = useMemo(() => {
    if (!resource?.availabilityWindows?.length) return 'Campus hours apply.';
    return resource.availabilityWindows.join(', ');
  }, [resource]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookingDate || !form.startTime || !form.endTime) {
      setError('Please fill in booking date, start time, and end time.');
      return;
    }

    if (form.endTime <= form.startTime) {
      setError('End time must be after start time.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isReschedule) {
        await rescheduleBooking(bookingId, form);
      } else {
        await createBooking(form);
      }
      navigate('/dashboard/bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save booking.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackgroundSlideshow slides={DASH_BG} className="min-h-screen pt-16">
      <div style={s.page}>
        <div style={s.container}>
          <button onClick={() => navigate('/dashboard/bookings')} style={s.backBtn}>Back to My Bookings</button>
          {loading ? (
            <div style={s.card}>Loading booking form...</div>
          ) : error && !resource ? (
            <div style={s.card}>{error}</div>
          ) : (
            <div style={s.layout}>
              <div style={s.card}>
                <div style={s.eyebrow}>{isReschedule ? 'Reschedule Booking' : 'New Booking'}</div>
                <h1 style={s.title}>{resource?.name}</h1>
                <p style={s.sub}>Pick a date and time, add the purpose, and submit for admin review.</p>
                {error && <div style={s.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={s.form}>
                  <Label text="Booking Date" />
                  <input type="date" value={form.bookingDate} onChange={e => setField('bookingDate', e.target.value)} style={s.input} required />

                  <div style={s.twoCol}>
                    <div>
                      <Label text="Start Time" />
                      <input type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} style={s.input} required />
                    </div>
                    <div>
                      <Label text="End Time" />
                      <input type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} style={s.input} required />
                    </div>
                  </div>

                  <Label text="Purpose" />
                  <textarea value={form.purpose} onChange={e => setField('purpose', e.target.value)} style={s.textarea} required />

                  <Label text="Expected Attendees" />
                  <input
                    type="number"
                    min="1"
                    max={resource?.capacity || undefined}
                    value={form.expectedAttendees}
                    onChange={e => setField('expectedAttendees', Number(e.target.value))}
                    style={s.input}
                    required
                  />

                  <button type="submit" disabled={saving} style={s.submitBtn}>
                    {saving ? 'Saving...' : isReschedule ? 'Submit Reschedule Request' : 'Submit Booking Request'}
                  </button>
                </form>
              </div>

              <div style={s.infoCard}>
                <h3 style={s.infoTitle}>Resource Details</h3>
                <InfoRow label="Type" value={resource?.type?.replaceAll('_', ' ')} />
                <InfoRow label="Location" value={resource?.location} />
                <InfoRow label="Capacity" value={resource?.capacity} />
                <InfoRow label="Availability" value={availabilityText} />
                {booking && <InfoRow label="Current Status" value={booking.status} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </BackgroundSlideshow>
  );
}

function Label({ text }) {
  return <label style={s.label}>{text}</label>;
}

function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <div style={s.infoLabel}>{label}</div>
      <div style={s.infoValue}>{value}</div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', padding: '24px 16px 48px', fontFamily: "'DM Sans', sans-serif" },
  container: { maxWidth: 1080, margin: '0 auto' },
  backBtn: { marginBottom: 16, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.12)', color: '#dbe4ff', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 18 },
  card: { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24, backdropFilter: 'blur(12px)' },
  eyebrow: { color: '#9fb0ff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 30, margin: '8px 0', fontWeight: 800 },
  sub: { color: 'rgba(255,255,255,0.72)', marginBottom: 18 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { color: '#dbe4ff', fontWeight: 700, fontSize: 13 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: '#fff', boxSizing: 'border-box' },
  textarea: { minHeight: 110, resize: 'vertical', width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.08)', color: '#fff', boxSizing: 'border-box' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  submitBtn: { marginTop: 8, background: 'linear-gradient(135deg,#4f6fff,#00e5c3)', border: 'none', color: '#fff', padding: '13px 16px', borderRadius: 12, cursor: 'pointer', fontWeight: 800 },
  infoCard: { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24, height: 'fit-content', backdropFilter: 'blur(12px)' },
  infoTitle: { color: '#fff', marginTop: 0, marginBottom: 16 },
  infoRow: { padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  infoLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { color: '#fff', fontWeight: 600, lineHeight: 1.5 },
  error: { marginBottom: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.24)', color: '#fecaca' },
};
