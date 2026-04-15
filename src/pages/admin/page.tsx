/**
 * /admin -- Admin dashboard with tabs: Sessions, Bookings.
 * Uses static token auth (cookie-based).
 */

import { useState, useEffect, useCallback } from "react";

type Tab = "sessions" | "bookings";

interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  currentBookings: number;
  status: string;
}

interface Booking {
  id: string;
  type: string;
  sessionId: string | null;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string | null;
  companyName: string;
  preferredDate: string | null;
  location: string | null;
  status: string;
  assignedAm: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-[#1A7A6B]/10 text-[#1A7A6B]",
    full: "bg-red-50 text-red-600",
    completed: "bg-blue-50 text-blue-600",
    cancelled: "bg-gray-100 text-gray-500",
    confirmed: "bg-[#1A7A6B]/10 text-[#1A7A6B]",
    pending_am_confirmation: "bg-[#FF6933]/10 text-[#FF6933]",
    no_show: "bg-red-50 text-red-600",
  };

  const labels: Record<string, string> = {
    open: "Open",
    full: "Vol",
    completed: "Afgerond",
    cancelled: "Geannuleerd",
    confirmed: "Bevestigd",
    pending_am_confirmation: "Wacht op AM",
    no_show: "No-show",
  };

  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors[status] || "bg-gray-100 text-gray-500"}`}>
      {labels[status] || status}
    </span>
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessRes, bookRes] = await Promise.all([
        fetch("/api/admin/sessions"),
        fetch("/api/admin/bookings"),
      ]);

      if (sessRes.status === 401 || bookRes.status === 401) {
        setAuthed(false);
        return;
      }

      setSessions(await sessRes.json());
      setBookingsList(await bookRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (res.ok) {
      setAuthed(true);
    } else {
      setAuthError("Ongeldig token");
    }
  }

  // Check if already authed
  useEffect(() => {
    fetch("/api/admin/sessions").then((res) => {
      if (res.ok) setAuthed(true);
    });
  }, []);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#071413] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <span className="text-3xl font-extrabold text-white tracking-tight">Quatt</span>
            <p className="mt-2 text-sm font-semibold text-white/50 uppercase tracking-wider">Admin Portal</p>
          </div>
          <div className="bg-white rounded-xl p-6 space-y-5">
            <div>
              <label htmlFor="token" className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">Token</label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Voer je admin token in"
                className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-base text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
              />
            </div>
            {authError && <p className="text-sm text-red-600 font-medium">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-[#FF6933] text-white font-semibold rounded-full px-8 py-3 text-base hover:brightness-95 transition-all duration-200"
            >
              Inloggen
            </button>
          </div>
        </form>
      </div>
    );
  }

  async function updateBookingStatus(id: string, status: string) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadData();
  }

  async function markAttendance(bookingId: string, attended: boolean) {
    await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, attended }),
    });
    loadData();
  }

  async function createSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        date: form.get("date"),
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
        location: form.get("location"),
        maxCapacity: parseInt(form.get("maxCapacity") as string) || 8,
      }),
    });
    setShowNewSession(false);
    loadData();
  }

  const typeLabels: Record<string, string> = {
    training: "Training",
    intro_call: "Kennismaking",
    first_install: "Eerste Installatie",
    agreement: "Overeenkomst",
  };

  const typeColors: Record<string, string> = {
    training: "bg-[#1A7A6B]/10 text-[#1A7A6B]",
    intro_call: "bg-[#FF6933]/10 text-[#FF6933]",
    first_install: "bg-[#97B9BF]/15 text-[#5A8A94]",
    agreement: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <header className="bg-[#071413] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold text-white tracking-tight">Quatt</span>
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider hidden sm:block">Admin</span>
          </div>
          <div className="flex gap-1 bg-white/10 rounded-full p-1">
            <button
              onClick={() => setTab("sessions")}
              className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                tab === "sessions" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-white/60 hover:text-white"
              }`}
            >
              Trainingen
            </button>
            <button
              onClick={() => setTab("bookings")}
              className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                tab === "bookings" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-white/60 hover:text-white"
              }`}
            >
              Boekingen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-[#8A8580] text-center py-16 text-lg">Laden...</p>
        ) : tab === "sessions" ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight">Training Sessies</h2>
              <button
                onClick={() => setShowNewSession(!showNewSession)}
                className={`text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 ${
                  showNewSession
                    ? "bg-gray-200 text-[#1A1A1A]"
                    : "bg-[#FF6933] text-white hover:brightness-95"
                }`}
              >
                {showNewSession ? "Annuleren" : "+ Nieuwe sessie"}
              </button>
            </div>

            {showNewSession && (
              <div className="bg-white rounded-xl border border-[#E8E4DD] p-6">
                <form onSubmit={createSession} className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <AdminInput name="title" label="Titel" required defaultValue="Installatie Training" />
                    <AdminInput name="date" label="Datum" type="date" required />
                    <AdminInput name="startTime" label="Start" type="time" required defaultValue="09:00" />
                    <AdminInput name="endTime" label="Eind" type="time" required defaultValue="11:00" />
                    <AdminInput name="location" label="Locatie" defaultValue="Quatt HQ, Amsterdam" />
                    <AdminInput name="maxCapacity" label="Max deelnemers" type="number" defaultValue="8" />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#FF6933] text-white font-semibold text-sm rounded-full px-6 py-2 hover:brightness-95 transition-all duration-200"
                  >
                    Sessie aanmaken
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white border-2 border-[#E8E4DD] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E4DD]">
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Datum</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Titel</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Tijd</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Locatie</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Bezetting</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-[#E8E4DD] last:border-0 hover:bg-[#F7F5F0]/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{s.date}</td>
                      <td className="px-6 py-4 font-bold text-[#1A1A1A]">{s.title}</td>
                      <td className="px-6 py-4">{s.startTime} - {s.endTime}</td>
                      <td className="px-6 py-4 text-[#8A8580]">{s.location}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${(s.currentBookings ?? 0) >= (s.maxCapacity ?? 8) ? "text-red-600" : "text-[#1A1A1A]"}`}>
                          {s.currentBookings ?? 0}/{s.maxCapacity ?? 8}
                        </span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-[#8A8580] text-base">Geen sessies gevonden</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight">Alle Boekingen</h2>
            <div className="bg-white rounded-xl overflow-x-auto border-2 border-[#E8E4DD]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E4DD]">
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Partner</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Bedrijf</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Datum</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">AM</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 font-bold text-[#8A8580] text-xs uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsList.map((b) => (
                    <tr key={b.id} className="border-b border-[#E8E4DD] last:border-0 hover:bg-[#F7F5F0]/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${typeColors[b.type] || "bg-gray-100 text-gray-500"}`}>
                          {typeLabels[b.type] || b.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1A1A1A]">{b.partnerName}</div>
                        <div className="text-xs text-[#8A8580] mt-0.5">{b.partnerEmail}</div>
                      </td>
                      <td className="px-6 py-4">{b.companyName}</td>
                      <td className="px-6 py-4 text-[#8A8580]">{b.preferredDate || "-"}</td>
                      <td className="px-6 py-4 text-[#8A8580]">{b.assignedAm?.split("@")[0] || "-"}</td>
                      <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {b.status === "pending_am_confirmation" && (
                            <button
                              onClick={() => updateBookingStatus(b.id, "confirmed")}
                              className="text-xs px-3 py-1.5 bg-[#1A7A6B]/10 text-[#1A7A6B] font-bold rounded-full hover:bg-[#1A7A6B]/20 transition-colors"
                            >
                              Bevestigen
                            </button>
                          )}
                          {b.status === "confirmed" && b.type === "training" && (
                            <>
                              <button
                                onClick={() => markAttendance(b.id, true)}
                                className="text-xs px-3 py-1.5 bg-[#1A7A6B]/10 text-[#1A7A6B] font-bold rounded-full hover:bg-[#1A7A6B]/20 transition-colors"
                              >
                                Aanwezig
                              </button>
                              <button
                                onClick={() => markAttendance(b.id, false)}
                                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-full hover:bg-red-100 transition-colors"
                              >
                                No-show
                              </button>
                            </>
                          )}
                          {["confirmed", "pending_am_confirmation"].includes(b.status) && (
                            <button
                              onClick={() => updateBookingStatus(b.id, "cancelled")}
                              className="text-xs px-3 py-1.5 bg-white text-[#8A8580] font-bold rounded-full hover:bg-gray-100 transition-colors"
                            >
                              Annuleren
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookingsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-[#8A8580] text-base">Geen boekingen gevonden</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminInput({
  name, label, type = "text", required, defaultValue,
}: {
  name: string; label: string; type?: string; required?: boolean; defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-[#1A1A1A]/60 mb-2">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl bg-[#F7F5F0] px-4 py-3 text-sm text-[#1A1A1A] border border-[#E8E4DD] focus:outline-none focus:border-[#FF6933] transition-colors duration-200"
      />
    </div>
  );
}
