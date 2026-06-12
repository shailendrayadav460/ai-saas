import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Calendar, HardDrive, FileText, Table2,
  Video, CheckCircle, XCircle, Plug, ExternalLink,
  MessageCircle, X, Send, Plus, Loader2, RefreshCw,
  File, Clock, User, Link2, Trash2, Eye, ChevronDown,
  AlignLeft, List, Upload
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { googleAPI } from '../api/google.api';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.includes('folder')) return '📁';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('document')) return '📝';
  if (mimeType.includes('presentation')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜️';
  return '📄';
};

const getEmbedUrl = (url, fileId) => {
  if (!url) {
    if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
    return '';
  }
  
  if (url.includes('docs.google.com/document')) {
    if (url.includes('/edit')) {
      return url.split('/edit')[0] + '/edit?embedded=true';
    }
    return url;
  }
  
  if (url.includes('docs.google.com/spreadsheets')) {
    if (url.includes('/edit')) {
      return url.split('/edit')[0] + '/edit?embedded=true';
    }
    return url;
  }

  if (url.includes('docs.google.com/presentation')) {
    if (url.includes('/edit')) {
      return url.split('/edit')[0] + '/embed';
    }
    return url;
  }

  if (url.includes('drive.google.com/file/d/')) {
    const parts = url.split('/view');
    return parts[0] + '/preview';
  }

  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  return url;
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-white/50 font-medium">{label}</label>}
    <input
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/8 transition-all"
      {...props}
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-white/50 font-medium">{label}</label>}
    <textarea
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/8 transition-all resize-none"
      {...props}
    />
  </div>
);

/* ─── Gmail Panel ─────────────────────────────────────────────────────── */
const GmailPanel = () => {
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.to || !form.subject || !form.body) return toast.error('Fill all fields');
    setSending(true);
    try {
      await googleAPI.sendEmail(form);
      toast.success('Email sent successfully! ✉️');
      setForm({ to: '', subject: '', body: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
          <Mail size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Compose Email</h3>
          <p className="text-xs text-white/40">Send via your Gmail account</p>
        </div>
      </div>
      <Input label="To (email address)" type="email" placeholder="recipient@example.com"
        value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
      <Input label="Subject" placeholder="Email subject..." value={form.subject}
        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
      <Textarea label="Message" placeholder="Write your email..." rows={6} value={form.body}
        onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
      >
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {sending ? 'Sending...' : 'Send Email'}
      </button>
    </div>
  );
};

/* ─── Calendar Panel ──────────────────────────────────────────────────── */
const CalendarPanel = () => {
  const [tab, setTab] = useState('list');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ summary: '', description: '', startDateTime: '', endDateTime: '', location: '' });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await googleAPI.listEvents({ maxResults: 10 });
      setEvents(data?.items || []);
    } catch (err) {
      toast.error(err.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === 'list') fetchEvents(); }, [tab, fetchEvents]);

  const handleCreate = async () => {
    if (!form.summary || !form.startDateTime || !form.endDateTime) return toast.error('Fill required fields');
    setCreating(true);
    try {
      await googleAPI.createEvent(form);
      toast.success('Event created! 📅');
      setForm({ summary: '', description: '', startDateTime: '', endDateTime: '', location: '' });
      setTab('list');
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Calendar size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Google Calendar</h3>
            <p className="text-xs text-white/40">View & create events</p>
          </div>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['list', 'create'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${tab === t ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {t === 'list' ? <span className="flex items-center gap-1"><List size={11} />Events</span> : <span className="flex items-center gap-1"><Plus size={11} />Create</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'list' ? (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={fetchEvents} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-white/30 gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-10 text-white/30 text-sm">No upcoming events found</div>
          ) : events.map(ev => (
            <div key={ev.id} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ev.summary || 'Untitled Event'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <Clock size={10} />
                      {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ev.start?.date || '—'}
                    </span>
                    {ev.location && <span className="text-xs text-white/30 truncate">{ev.location}</span>}
                  </div>
                </div>
                {ev.hangoutLink && (
                  <a href={ev.hangoutLink} target="_blank" rel="noreferrer"
                    className="shrink-0 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    <Video size={11} /> Join
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <Input label="Event Title *" placeholder="Meeting with team" value={form.summary}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date & Time *" type="datetime-local" value={form.startDateTime}
              onChange={e => setForm(f => ({ ...f, startDateTime: e.target.value }))} />
            <Input label="End Date & Time *" type="datetime-local" value={form.endDateTime}
              onChange={e => setForm(f => ({ ...f, endDateTime: e.target.value }))} />
          </div>
          <Input label="Location (optional)" placeholder="Office / Google Meet link" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <Textarea label="Description" placeholder="Event details..." rows={3} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <button onClick={handleCreate} disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {creating ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Meet Panel ──────────────────────────────────────────────────────── */
const MeetPanel = () => {
  const [form, setForm] = useState({ title: '', startDateTime: '', endDateTime: '', attendees: '' });
  const [creating, setCreating] = useState(false);
  const [meetLink, setMeetLink] = useState(null);

  const handleCreate = async () => {
    if (!form.title || !form.startDateTime || !form.endDateTime) return toast.error('Fill required fields');
    setCreating(true);
    try {
      const attendeeList = form.attendees ? form.attendees.split(',').map(e => e.trim()).filter(Boolean) : [];
      const result = await googleAPI.createMeet({ ...form, attendees: attendeeList });
      setMeetLink(result?.hangoutLink || result?.meetLink || null);
      toast.success('Google Meet created! 🎥');
    } catch (err) {
      toast.error(err.message || 'Failed to create Meet');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
          <Video size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Create Google Meet</h3>
          <p className="text-xs text-white/40">Schedule a video meeting</p>
        </div>
      </div>

      {meetLink ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mx-auto">
            <Video size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Meeting Created!</p>
            <p className="text-white/40 text-xs mb-3">Share this link with participants</p>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
              <Link2 size={13} className="text-primary-400 shrink-0" />
              <span className="text-xs text-primary-400 flex-1 truncate">{meetLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(meetLink); toast.success('Copied!'); }}
                className="text-xs text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-all">Copy</button>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={meetLink} target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90">
              <Video size={14} /> Join Now
            </a>
            <button onClick={() => setMeetLink(null)}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/15 transition-all">
              New Meeting
            </button>
          </div>
        </div>
      ) : (
        <>
          <Input label="Meeting Title *" placeholder="Weekly Standup" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start *" type="datetime-local" value={form.startDateTime}
              onChange={e => setForm(f => ({ ...f, startDateTime: e.target.value }))} />
            <Input label="End *" type="datetime-local" value={form.endDateTime}
              onChange={e => setForm(f => ({ ...f, endDateTime: e.target.value }))} />
          </div>
          <Input label="Attendees (comma-separated emails)" placeholder="a@gmail.com, b@gmail.com"
            value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} />
          <button onClick={handleCreate} disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
            {creating ? 'Creating Meet...' : 'Create Google Meet'}
          </button>
        </>
      )}
    </div>
  );
};

/* ─── Drive Panel ─────────────────────────────────────────────────────── */
const DrivePanel = ({ onPreview }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await googleAPI.listFiles({ pageSize: 15 });
      setFiles(data?.files || []);
    } catch (err) {
      toast.error(err.message || 'Could not load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <HardDrive size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Google Drive</h3>
            <p className="text-xs text-white/40">{files.length} files loaded</p>
          </div>
        </div>
        <button onClick={fetchFiles} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-white/30 gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading files...
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">No files found in Drive</div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {files.map(file => (
            <div key={file.id}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/8 rounded-xl px-3 py-2.5 border border-white/5 hover:border-white/10 transition-all group">
              <span className="text-lg shrink-0">{getFileIcon(file.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ''}
                  {file.size ? ` · ${formatSize(parseInt(file.size))}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {file.webViewLink && (
                  <button
                    onClick={() => onPreview && onPreview(file)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Preview File"
                  >
                    <Eye size={13} />
                  </button>
                )}
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Open in Google Drive"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <a href="https://drive.google.com" target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-all">
        <ExternalLink size={12} /> Open Google Drive
      </a>
    </div>
  );
};

/* ─── Sheets Panel ────────────────────────────────────────────────────── */
/* ─── Sheets Panel ────────────────────────────────────────────────────── */
const SheetsPanel = ({ onPreview }) => {
  const [form, setForm] = useState({ title: '', headers: '', rows: '' });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  const handleCreate = async () => {
    if (!form.title) return toast.error('Enter a spreadsheet title');
    setCreating(true);
    try {
      const headers = form.headers ? form.headers.split(',').map(h => h.trim()) : [];
      const rowLines = form.rows ? form.rows.split('\n').filter(r => r.trim()) : [];
      const values = headers.length ? [headers, ...rowLines.map(r => r.split(',').map(c => c.trim()))] : rowLines.map(r => r.split(',').map(c => c.trim()));
      const data = await googleAPI.createSheet({ title: form.title, values });
      setResult(data);
      toast.success('Spreadsheet created! 📊');
    } catch (err) {
      toast.error(err.message || 'Failed to create spreadsheet');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
          <Table2 size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Google Sheets</h3>
          <p className="text-xs text-white/40">Create a new spreadsheet</p>
        </div>
      </div>

      {result ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto">
            <Table2 size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Spreadsheet Created!</p>
            <p className="text-white/40 text-xs mb-3">{result.title || form.title}</p>
            <div className="flex gap-2">
              {result.spreadsheetUrl && (
                <button
                  onClick={() => onPreview && onPreview({ name: result.title || form.title, url: result.spreadsheetUrl, serviceId: 'sheets', mimeType: 'application/vnd.google-apps.spreadsheet' })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <Eye size={14} /> Preview
                </button>
              )}
              {result.spreadsheetUrl && (
                <a href={result.spreadsheetUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-all">
                  <ExternalLink size={14} /> Open
                </a>
              )}
            </div>
            <button onClick={() => { setResult(null); setForm({ title: '', headers: '', rows: '' }); }}
              className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-all">
              New Sheet
            </button>
          </div>
        </div>
      ) : (
        <>
          <Input label="Spreadsheet Title *" placeholder="My Data Sheet" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Column Headers (comma-separated)" placeholder="Name, Email, Phone, Status"
            value={form.headers} onChange={e => setForm(f => ({ ...f, headers: e.target.value }))} />
          <Textarea label="Data Rows (one row per line, comma-separated)" rows={4}
            placeholder={"John, john@email.com, 9999, Active\nJane, jane@email.com, 8888, Pending"}
            value={form.rows} onChange={e => setForm(f => ({ ...f, rows: e.target.value }))} />
          <button onClick={handleCreate} disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Table2 size={15} />}
            {creating ? 'Creating...' : 'Create Spreadsheet'}
          </button>
        </>
      )}
    </div>
  );
};

/* ─── Docs Panel ──────────────────────────────────────────────────────── */
const DocsPanel = ({ onPreview }) => {
  const [form, setForm] = useState({ title: '', content: '' });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  const handleCreate = async () => {
    if (!form.title) return toast.error('Enter a document title');
    setCreating(true);
    try {
      const data = await googleAPI.createDoc({ title: form.title, content: form.content });
      setResult(data);
      toast.success('Document created! 📝');
    } catch (err) {
      toast.error(err.message || 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <FileText size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Google Docs</h3>
          <p className="text-xs text-white/40">Create a new document</p>
        </div>
      </div>

      {result ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto">
            <FileText size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Document Created!</p>
            <p className="text-white/40 text-xs mb-3">{result.title || form.title}</p>
            <div className="flex gap-2">
              {result.documentUrl && (
                <button
                  onClick={() => onPreview && onPreview({ name: result.title || form.title, url: result.documentUrl, serviceId: 'docs', mimeType: 'application/vnd.google-apps.document' })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <Eye size={14} /> Preview
                </button>
              )}
              {result.documentUrl && (
                <a href={result.documentUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-all">
                  <ExternalLink size={14} /> Open
                </a>
              )}
            </div>
            <button onClick={() => { setResult(null); setForm({ title: '', content: '' }); }}
              className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-all">
              New Doc
            </button>
          </div>
        </div>
      ) : (
        <>
          <Input label="Document Title *" placeholder="My Report" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Initial Content (optional)" rows={8}
            placeholder="Start writing your document content here..."
            value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          <button onClick={handleCreate} disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            {creating ? 'Creating...' : 'Create Document'}
          </button>
        </>
      )}
    </div>
  );
};

/* ─── WhatsApp Panel ──────────────────────────────────────────────────── */
const WhatsAppPanel = () => {
  const [form, setForm] = useState({ to: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.to || !form.message) return toast.error('Fill all fields');
    setSending(true);
    try {
      await import('../api/axios').then(m => m.default.post('/whatsapp/send', {
        to: form.to.startsWith('+') ? form.to : `+${form.to}`,
        message: form.message,
      }));
      toast.success('WhatsApp message sent! 💬');
      setForm({ to: '', message: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to send WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <MessageCircle size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Send WhatsApp</h3>
          <p className="text-xs text-white/40">Via Twilio Sandbox</p>
        </div>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
        ⚠️ Recipient must first send <strong>"join &lt;your-sandbox-keyword&gt;"</strong> to the Twilio sandbox number to receive messages.
      </div>
      <Input label="Phone Number (with country code)" placeholder="+919999999999" value={form.to}
        onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
      <Textarea label="Message" placeholder="Hello! This is a test message via AI SaaS." rows={5}
        value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
      <button onClick={handleSend} disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {sending ? 'Sending...' : 'Send WhatsApp Message'}
      </button>
    </div>
  );
};

/* ─── Panel Map ───────────────────────────────────────────────────────── */
const PANELS = {
  gmail: GmailPanel,
  calendar: CalendarPanel,
  meet: MeetPanel,
  drive: DrivePanel,
  sheets: SheetsPanel,
  docs: DocsPanel,
  whatsapp: WhatsAppPanel,
};

/* ─── Service Drawer ──────────────────────────────────────────────────── */
const ServiceDrawer = ({ service, onClose, onPreview }) => {
  const Panel = PANELS[service.id];
  const Icon = service.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="ml-auto w-full max-w-md h-full flex flex-col border-l border-white/10 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(12,12,24,0.99) 0%, rgba(18,18,36,0.99) 100%)' }}
        >
          {/* Drawer Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg`}>
              <Icon size={17} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white">{service.name}</h2>
              <p className="text-xs text-white/40">{service.description}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {Panel ? <Panel onPreview={onPreview} /> : (
              <div className="text-center py-10 text-white/30 text-sm">Panel not available</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Service Card ────────────────────────────────────────────────────── */
const GOOGLE_SERVICES = [
  { id: 'gmail', name: 'Gmail', description: 'Compose & send emails', icon: Mail, color: 'from-red-500 to-pink-600', badge: 'Email', url: 'https://mail.google.com' },
  { id: 'calendar', name: 'Google Calendar', description: 'View & create events', icon: Calendar, color: 'from-blue-500 to-indigo-600', badge: 'Calendar', url: 'https://calendar.google.com/calendar/u/0/embed' },
  { id: 'meet', name: 'Google Meet', description: 'Schedule video meetings', icon: Video, color: 'from-green-500 to-teal-600', badge: 'Meeting', url: 'https://meet.google.com' },
  { id: 'drive', name: 'Google Drive', description: 'Browse & manage files', icon: HardDrive, color: 'from-amber-500 to-orange-600', badge: 'Storage', url: 'https://drive.google.com' },
  { id: 'sheets', name: 'Google Sheets', description: 'Create spreadsheets with data', icon: Table2, color: 'from-emerald-500 to-green-600', badge: 'Spreadsheet', url: 'https://docs.google.com/spreadsheets' },
  { id: 'docs', name: 'Google Docs', description: 'Create & write documents', icon: FileText, color: 'from-violet-500 to-indigo-600', badge: 'Document', url: 'https://docs.google.com/document' },
];

const WHATSAPP_SERVICE = {
  id: 'whatsapp',
  name: 'WhatsApp (via Twilio)',
  description: 'Send WhatsApp messages to contacts',
  icon: MessageCircle,
  color: 'from-green-500 to-emerald-600',
  badge: 'Twilio API',
  url: 'https://web.whatsapp.com',
};

const ServiceCard = ({ service, connected, onOpen }) => {
  const { icon: Icon, name, description, color, badge } = service;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className="glass rounded-2xl p-5 flex flex-col gap-4 hover:border-white/25 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon size={22} className="text-white" />
        </div>
        {connected ? (
          <Badge variant="success"><CheckCircle size={10} />Connected</Badge>
        ) : (
          <Badge variant="warning"><XCircle size={10} />Not connected</Badge>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-white">{name}</h3>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{badge}</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/5">
        <span className="text-xs text-white/30">{connected ? '✅ AI enabled' : 'Connect to use'}</span>
        <span className="text-xs text-primary-400 group-hover:text-primary-300 flex items-center gap-1 transition-colors font-medium">
          Open →
        </span>
      </div>
    </motion.div>
  );
};

/* ─── File Preview Modal ──────────────────────────────────────────────── */
const ServiceIconMap = {
  gmail: Mail,
  calendar: Calendar,
  meet: Video,
  drive: HardDrive,
  sheets: Table2,
  docs: FileText,
  whatsapp: MessageCircle,
};

const ServiceColorMap = {
  gmail: 'text-red-500',
  calendar: 'text-blue-500',
  meet: 'text-green-500',
  drive: 'text-amber-500',
  sheets: 'text-emerald-500',
  docs: 'text-violet-500',
  whatsapp: 'text-green-500',
};

const FilePreviewModal = ({ file, onClose }) => {
  if (!file) return null;
  const embedUrl = getEmbedUrl(file.url || file.webViewLink, file.id);
  const IconComponent = ServiceIconMap[file.id] || ServiceIconMap[file.serviceId] || null;
  const iconColorClass = ServiceColorMap[file.id] || ServiceColorMap[file.serviceId] || 'text-primary-400';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="w-full max-w-5xl h-[85vh] rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{ background: 'linear-gradient(160deg, rgba(12,12,24,0.99) 0%, rgba(18,18,36,0.99) 100%)' }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl shrink-0 flex items-center justify-center">
                {IconComponent ? (
                  <IconComponent size={20} className={iconColorClass} />
                ) : (
                  <span>{file.mimeType ? getFileIcon(file.mimeType) : '📄'}</span>
                )}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{file.name || 'File Preview'}</h3>
                <p className="text-xs text-white/40 truncate">Iframe Viewer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(file.url || file.webViewLink) && (
                <a
                  href={file.url || file.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white transition-all font-medium border border-white/5"
                >
                  <ExternalLink size={12} /> Open original
                </a>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Content / Iframe */}
          <div className="flex-1 bg-black/20 relative">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-none bg-white"
                allow="autoplay"
                title={file.name}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-2">
                <p className="text-sm">No preview URL available for this file.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Main Page ───────────────────────────────────────────────────────── */
const Services = () => {
  const { googleConnected, checkGoogleStatus, setGoogleConnected } = useApp();
  const [status, setStatus] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [activeService, setActiveService] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => { const s = await checkGoogleStatus(); setStatus(s); };
    fetchStatus();
  }, [checkGoogleStatus]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setActiveService(null);
        setPreviewFile(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleConnect = () => { window.location.href = googleAPI.connectUrl(); };
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await googleAPI.disconnect();
      setGoogleConnected(false);
      setStatus({ connected: false });
      toast.success('Google account disconnected');
    } catch { toast.error('Failed to disconnect'); }
    finally { setDisconnecting(false); }
  };

  return (
    <div className="p-6 space-y-6">
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Connection Banner */}
      <div className={`rounded-2xl p-5 ${googleConnected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-primary-600/10 border border-primary-500/20'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${googleConnected ? 'bg-emerald-500/20' : 'bg-primary-500/20'}`}>
              <Plug size={20} className={googleConnected ? 'text-emerald-400' : 'text-primary-400'} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {googleConnected ? '✅ Google Account Connected' : 'Connect Your Google Account'}
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                {googleConnected
                  ? `All services active · Connected ${status?.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : ''}`
                  : 'Connect to enable Gmail, Calendar, Drive, Docs, Sheets & Meet'}
              </p>
            </div>
          </div>
          {googleConnected ? (
            <Button variant="danger" onClick={handleDisconnect} loading={disconnecting} size="sm">Disconnect</Button>
          ) : (
            <Button variant="primary" onClick={handleConnect}
              leftIcon={<img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />}>
              Connect Google <ExternalLink size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-white">Google Services</h3>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Click a card to use</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GOOGLE_SERVICES.map(s => (
            <ServiceCard key={s.id} service={s} connected={googleConnected} onOpen={() => {
              if (googleConnected) {
                setPreviewFile({ name: s.name, url: s.url, id: s.id, mimeType: 'application/vnd.google-apps.folder' });
              } else {
                toast.error(`Please connect your Google Account to use ${s.name}`);
              }
            }} />
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4">Other Services</h3>
        <motion.div whileHover={{ y: -2 }} onClick={() => setPreviewFile({ name: 'WhatsApp Web', url: WHATSAPP_SERVICE.url, id: WHATSAPP_SERVICE.id, mimeType: 'message' })}
          className="glass rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-white/20 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">WhatsApp (via Twilio)</h3>
            <p className="text-xs text-white/50 mt-0.5">Send messages directly from the app</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Twilio API</Badge>
            <span className="text-xs text-primary-400 group-hover:text-primary-300 font-medium transition-colors">Open →</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Services;
