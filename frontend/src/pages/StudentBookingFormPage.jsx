import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBooking, getBookingAvailability, getMyBookings, getResourceById, rescheduleBooking } from '../api/api';
import BackgroundSlideshow, { toImgurDirect } from '../components/common/BackgroundSlideshow';

const DASH_BG = [toImgurDirect('https://imgur.com/t4yWwhI')];
const DEFAULT_WINDOWS = ['08:00-18:00'];
const SLOT_LENGTH_HOURS = 2;

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

function minutesToTime(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, '0');
  const minutes = String(value % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatTimeLabel(value) {
  const totalMinutes = timeToMinutes(value);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function buildTwoHourSlots(windows) {
  return (windows?.length ? windows : DEFAULT_WINDOWS).flatMap((windowRange) => {
    const [start, end] = windowRange.split('-').map((part) => part.trim());
    if (!start || !end) return [];

    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    const slotSize = SLOT_LENGTH_HOURS * 60;
    const slots = [];

    for (let slotStart = startMinutes; slotStart + slotSize <= endMinutes; slotStart += slotSize) {
      const slotEnd = slotStart + slotSize;
      slots.push({
        key: `${minutesToTime(slotStart)}-${minutesToTime(slotEnd)}`,
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd),
        label: `${formatTimeLabel(minutesToTime(slotStart))} - ${formatTimeLabel(minutesToTime(slotEnd))}`,
      });
    }

    return slots;
  });
}

export default function StudentBookingFormPage() {
  const navigate = useNavigate();
  const { resourceId, bookingId } = useParams();
  const isReschedule = Boolean(bookingId);
  const [resource, setResource] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    const loadAvailability = async () => {
      if (!resource?.id || !form.bookingDate) {
        if (!cancelled) setAvailability(null);
        return;
      }

      try {
        if (!cancelled) setAvailabilityLoading(true);
        const res = await getBookingAvailability({
          resourceId: resource.id,
          bookingDate: form.bookingDate,
          excludeBookingId: isReschedule ? bookingId : undefined,
        });
        if (!cancelled) setAvailability(res.data);
      } catch (err) {
        if (!cancelled) setAvailability(null);
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };

    loadAvailability();

    const intervalId = window.setInterval(loadAvailability, 3000);
    const handleFocus = () => loadAvailability();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAvailability();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [bookingId, form.bookingDate, isReschedule, resource?.id]);

  const availabilityText = useMemo(() => {
    if (!resource?.availabilityWindows?.length) return 'Campus hours apply.';
    return resource.availabilityWindows.join(', ');
  }, [resource]);

  const timeSlots = useMemo(() => {
    const generatedSlots = buildTwoHourSlots(resource?.availabilityWindows);
    const currentSlotKey = form.startTime && form.endTime ? `${form.startTime}-${form.endTime}` : '';
    const availabilityMap = new Map((availability?.slots || []).map((slot) => [`${slot.startTime}-${slot.endTime}`, slot]));

    const mappedSlots = generatedSlots.map((slot) => {
      const slotAvailability = availabilityMap.get(slot.key);
      const remainingCapacity = slotAvailability?.remainingCapacity ?? resource?.capacity ?? 0;
      return {
        ...slot,
        remainingCapacity,
        occupiedCapacity: slotAvailability?.occupiedCapacity ?? 0,
        available: slotAvailability?.available ?? true,
      };
    });

    if (currentSlotKey && !mappedSlots.some((slot) => slot.key === currentSlotKey)) {
      return [
        ...mappedSlots,
        {
          key: currentSlotKey,
          startTime: form.startTime,
          endTime: form.endTime,
          label: `${formatTimeLabel(form.startTime)} - ${formatTimeLabel(form.endTime)}`,
          remainingCapacity: resource?.capacity ?? 0,
          occupiedCapacity: 0,
          available: true,
        },
      ].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }

    return mappedSlots;
  }, [availability?.slots, form.endTime, form.startTime, resource?.availabilityWindows, resource?.capacity]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const selectedSlotKey = form.startTime && form.endTime ? `${form.startTime}-${form.endTime}` : '';
  const selectedSlot = useMemo(
    () => timeSlots.find((slot) => slot.key === selectedSlotKey) || null,
    [selectedSlotKey, timeSlots]
  );
  const seatsAfterThisBooking = selectedSlot
    ? Math.max(selectedSlot.remainingCapacity - Number(form.expectedAttendees || 0), 0)
    : null;

  const selectSlot = (slot) => {
    if (!slot.available || slot.remainingCapacity < form.expectedAttendees) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookingDate || !form.startTime || !form.endTime) {
      setError('Please choose a booking date and one 2-hour slot.');
      return;
    }

    if (form.endTime <= form.startTime) {
      setError('End time must be after start time.');
      return;
    }

    if (selectedSlot && selectedSlot.remainingCapacity < form.expectedAttendees) {
      setError(`Only ${selectedSlot.remainingCapacity} spaces remain for that slot.`);
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

                  <div>
                    <Label text="Available 2-Hour Slots" />
                    <div style={s.slotGrid}>
                      {timeSlots.map((slot) => {
                        const isSelected = selectedSlotKey === slot.key;
                        const canBookSlot = slot.available && slot.remainingCapacity >= form.expectedAttendees;
                        return (
                          <button
                            key={slot.key}
                            type="button"
                            onClick={() => selectSlot(slot)}
                            disabled={!canBookSlot}
                            style={{
                              ...s.slotTab,
                              ...(isSelected ? s.slotTabActive : {}),
                              ...(!canBookSlot ? s.slotTabDisabled : {}),
                            }}
                          >
                            <div>{slot.label}</div>
                            <div style={s.slotMeta}>
                              {!slot.available
                                ? 'Full'
                                : `${slot.remainingCapacity} space${slot.remainingCapacity === 1 ? '' : 's'} left`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div style={s.slotHint}>
                      Each booking slot is limited to {SLOT_LENGTH_HOURS} hours. Cancelled bookings reopen the slot automatically.
                    </div>
                    {selectedSlot && (
                      <div style={s.capacityBanner}>
                        Live remaining capacity: {selectedSlot.remainingCapacity}
                        {availabilityLoading ? ' (updating...)' : ''}
                        <div style={s.capacityMeta}>
                          If you book for {form.expectedAttendees}, balance after this request: {seatsAfterThisBooking}
                        </div>
                      </div>
                    )}
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
                {selectedSlot && (
                  <InfoRow
                    label="Remaining Capacity"
                    value={`${selectedSlot.remainingCapacity} seats live right now`}
                  />
                )}
                {selectedSlot && (
                  <InfoRow
                    label="After Your Request"
                    value={`${seatsAfterThisBooking} seats would remain`}
                  />
                )}
                <InfoRow
                  label="Live Slot Status"
                  value="Cancelled, rejected, and rescheduled bookings release capacity again."
                />
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
  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 },
  slotTab: { width: '100%', padding: '11px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: '#dbe4ff', cursor: 'pointer', fontWeight: 700, textAlign: 'center' },
  slotTabActive: { background: 'linear-gradient(135deg,#4f6fff,#00e5c3)', color: '#fff', border: '1px solid transparent', boxShadow: '0 10px 24px rgba(79,111,255,0.24)' },
  slotTabDisabled: { opacity: 0.45, cursor: 'not-allowed' },
  slotMeta: { marginTop: 6, fontSize: 11, fontWeight: 600, opacity: 0.9 },
  slotHint: { marginTop: 8, color: 'rgba(219,228,255,0.72)', fontSize: 12 },
  capacityBanner: { marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)', color: '#d1fae5', fontSize: 13, fontWeight: 700 },
  capacityMeta: { marginTop: 6, fontSize: 12, fontWeight: 600, color: '#a7f3d0' },
  submitBtn: { marginTop: 8, background: 'linear-gradient(135deg,#4f6fff,#00e5c3)', border: 'none', color: '#fff', padding: '13px 16px', borderRadius: 12, cursor: 'pointer', fontWeight: 800 },
  infoCard: { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24, height: 'fit-content', backdropFilter: 'blur(12px)' },
  infoTitle: { color: '#fff', marginTop: 0, marginBottom: 16 },
  infoRow: { padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  infoLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { color: '#fff', fontWeight: 600, lineHeight: 1.5 },
  error: { marginBottom: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(239,68,68,0.24)', color: '#fecaca' },
};
