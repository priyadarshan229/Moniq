import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, provider, db } from './firebase';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, ArrowUpDown, Target, Building2,
  Users, Calendar, Plus, Download, AlertTriangle,
  ChevronRight, Trash2, Settings, Shield, Eye, Lock, Server
} from 'lucide-react';

// ─── Defaults ────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { name: 'Rent',          emoji: '🏠', color: '#00E5FF' },
  { name: 'Food',          emoji: '🍛', color: '#FF9500' },
  { name: 'EMI',           emoji: '🏦', color: '#F97316' },
  { name: 'Transport',     emoji: '🚗', color: '#7C3AED' },
  { name: 'Entertainment', emoji: '🎬', color: '#EC4899' },
  { name: 'Utilities',     emoji: '⚡', color: '#06B6D4' },
  { name: 'Health',        emoji: '💊', color: '#00D68F' },
  { name: 'Shopping',      emoji: '🛍️', color: '#FFB800' },
  { name: 'Other',         emoji: '📦', color: '#8A95A3' },
];

const PRESET_COLORS = [
  '#00E5FF','#FF9500','#F97316','#7C3AED','#EC4899',
  '#06B6D4','#00D68F','#FFB800','#FF3B5C','#10B981',
  '#6366F1','#F43F5E','#84CC16','#F59E0B','#8B5CF6'
];

// ─── Styles ───────────────────────────────────────────────────────
const S = {
  app: { background: '#07080A', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#EAEEF2' },
  sidebar: { position: 'fixed', top: 0, left: 0, width: '220px', height: '100vh', background: '#0D0F12', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 100 },
  sidebarLogo: { padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  logoDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#00E5FF', flexShrink: 0 },
  sidebarNav: { padding: '12px 0', flex: 1 },
  navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', color: active ? '#00E5FF' : '#8A95A3', background: active ? 'rgba(0,229,255,0.08)' : 'transparent', borderLeft: `2px solid ${active ? '#00E5FF' : 'transparent'}`, fontSize: '13px', marginRight: '8px', borderRadius: '0 8px 8px 0', transition: 'all 0.15s' }),
  sidebarBottom: { padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  guestCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#131619', borderRadius: '10px', cursor: 'pointer' },
  guestAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 },
  main: { marginLeft: '220px', minHeight: '100vh', paddingTop: '44px' },
  banner: { position: 'fixed', top: 0, left: '220px', right: 0, zIndex: 200, background: 'rgba(0,229,255,0.07)', borderBottom: '1px solid rgba(0,229,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '8px 20px', fontSize: '12px', color: '#8A95A3' },
  bannerBtn: { background: '#00E5FF', color: '#000', border: 'none', borderRadius: '20px', padding: '3px 14px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  content: { padding: '28px 32px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' },
  pageSub: { fontSize: '13px', color: '#3D4A57', marginTop: '3px' },
  addBtn: { background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' },
  kpiCard: (color) => ({ background: '#111418', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px', borderTop: `2px solid ${color}` }),
  kpiLabel: { fontSize: '10px', color: '#3D4A57', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '10px' },
  kpiValue: (color) => ({ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: '800', color, lineHeight: 1, marginBottom: '6px' }),
  kpiSub: { fontSize: '11px', color: '#3D4A57' },
  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' },
  chartCard: { background: '#111418', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '22px' },
  chartTitle: { fontSize: '13px', fontWeight: '600', color: '#8A95A3', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  chartBadge: { background: 'rgba(0,229,255,0.1)', color: '#00E5FF', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' },
  card: { background: '#111418', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '10px', color: '#3D4A57', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  td: { padding: '13px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '13px', verticalAlign: 'middle' },
  progTrack: { height: '5px', background: '#131619', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' },
  progFill: (pct, color) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }),
  warningCard: { background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.2)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#111418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '460px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
  modalClose: { position: 'absolute', top: '16px', right: '16px', background: '#131619', border: 'none', color: '#8A95A3', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px' },
  input: { width: '100%', background: '#0D0F12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#EAEEF2', fontSize: '14px', outline: 'none', marginBottom: '12px', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' },
  label: { fontSize: '11px', color: '#3D4A57', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '6px', display: 'block' },
  primaryBtn: { width: '100%', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#3D4A57' },
};

// ─── Animated Demo ────────────────────────────────────────────────
function AnimatedDemo() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState(0);
  const fullText = 'Swiggy Order';

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        setStep(0); setTyped(''); setExpenses([]); setAmount(0);
        await delay(800);
        if (cancelled) break;
        setStep(1);
        for (let i = 1; i <= fullText.length; i++) {
          if (cancelled) break;
          await delay(80);
          setTyped(fullText.slice(0, i));
        }
        await delay(400);
        setStep(2);
        await delay(600);
        setStep(3);
        setExpenses([{ desc: 'Swiggy Order', category: 'Food', amount: 450, color: '#FF9500' }]);
        setAmount(450);
        await delay(800);
        setExpenses(e => [...e, { desc: 'Ola Ride', category: 'Transport', amount: 180, color: '#7C3AED' }]);
        setAmount(630);
        await delay(800);
        setExpenses(e => [...e, { desc: 'BigBasket', category: 'Food', amount: 1200, color: '#FF9500' }]);
        setAmount(1830);
        await delay(1200);
        setStep(4);
        await delay(3000);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const pct = Math.min(Math.round(amount / 5000 * 100), 100);

  return (
    <div style={{ background: '#0D0F12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', maxWidth: '460px', width: '100%' }}>
      <div style={{ fontSize: '11px', color: '#3D4A57', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D68F' }}/>Live Demo
      </div>

      {step <= 3 && (
        <div style={{ background: '#131619', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#3D4A57', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Add Expense</div>
          <div style={{ background: '#0D0F12', border: `1px solid ${step >= 1 ? '#00E5FF' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#EAEEF2', marginBottom: '8px', minHeight: '38px', transition: 'border-color 0.3s' }}>
            {typed}<span style={{ opacity: step === 1 ? 1 : 0 }}>|</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ background: '#0D0F12', border: `1px solid ${step >= 2 ? '#FF9500' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: step >= 2 ? '#FF9500' : '#3D4A57', flex: 1, transition: 'all 0.3s' }}>
              {step >= 2 ? '₹450' : '₹ Amount'}
            </div>
            <div style={{ background: '#0D0F12', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#FF9500' }}>🍛 Food</div>
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {expenses.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#131619', borderRadius: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px' }}>{e.desc}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', background: `${e.color}20`, color: e.color, padding: '2px 8px', borderRadius: '20px' }}>{e.category}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700' }}>₹{e.amount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {amount > 0 && (
        <div style={{ background: '#131619', borderRadius: '12px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#8A95A3' }}>Monthly Budget</span>
            <span style={{ fontFamily: 'monospace', color: pct > 80 ? '#FF9500' : '#00E5FF' }}>₹{amount.toLocaleString('en-IN')} / ₹5,000</span>
          </div>
          <div style={{ height: '6px', background: '#0D0F12', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#FF9500' : '#00E5FF', borderRadius: '3px', transition: 'width 0.6s ease' }}/>
          </div>
          <div style={{ fontSize: '11px', color: '#3D4A57', marginTop: '6px' }}>{pct}% used · ₹{(5000 - amount).toLocaleString('en-IN')} remaining</div>
        </div>
      )}

      {step === 4 && (
        <div style={{ marginTop: '12px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#00E5FF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✓ Dashboard updated — daily budget ₹{Math.round((60000 - 1830) / 21).toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────
function LandingPage({ onGetStarted }) {
  return (
    <div style={{ background: '#07080A', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#EAEEF2', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: '#00E5FF', filter: 'blur(140px)', opacity: 0.06, top: '-200px', left: '-100px', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: '#0066FF', filter: 'blur(120px)', opacity: 0.06, top: '200px', right: '-100px', pointerEvents: 'none' }}/>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', position: 'relative', zIndex: 10 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00E5FF' }}/>Moniq
        </div>
        <button onClick={onGetStarted} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#EAEEF2', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          Sign up free
        </button>
      </div>

      {/* Hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 48px 40px', position: 'relative', zIndex: 10 }}>
        <div style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '20px', padding: '5px 16px', fontSize: '11px', color: '#00E5FF', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5FF' }}/>
          Built for India's salaried professionals
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: '800', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '20px', maxWidth: '780px' }}>
          Your money,{' '}
          <span style={{ background: 'linear-gradient(135deg, #00E5FF, #0066FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            finally in control.
          </span>
        </h1>
        <p style={{ fontSize: '17px', color: '#8A95A3', maxWidth: '500px', lineHeight: 1.7, marginBottom: '36px' }}>
          Track expenses by salary cycle, know exactly when your money runs out, and manage EMIs — all in one place.
        </p>
        <button onClick={onGetStarted} style={{ background: '#00E5FF', color: '#000', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          Get Started — it's free <ChevronRight size={16}/>
        </button>
        <p style={{ fontSize: '12px', color: '#3D4A57' }}>No credit card · No app download · Data stays yours</p>
      </div>

      {/* Animated Demo */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 48px 64px', position: 'relative', zIndex: 10 }}>
        <AnimatedDemo/>
      </div>

      {/* How it works */}
      <div style={{ padding: '64px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>How it works</div>
          <div style={{ fontSize: '15px', color: '#8A95A3' }}>Three steps to financial clarity</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
          {[
            { step: '01', icon: '📝', title: 'Add your expenses', desc: 'Log expenses as you spend — categorise them, add notes, and track who paid. Takes 5 seconds per expense.' },
            { step: '02', icon: '📅', title: 'Set your salary cycle', desc: 'Tell us your salary and when it gets credited. Your budget resets on that date — not Jan 1.' },
            { step: '03', icon: '🛫', title: 'Know your runway', desc: "See exactly when your money runs out based on your real spending pace. Make decisions before it's too late." },
          ].map(item => (
            <div key={item.step} style={{ background: '#111418', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontSize: '11px', color: '#00E5FF', fontFamily: 'monospace', marginBottom: '16px', letterSpacing: '1px' }}>{item.step}</div>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: '#8A95A3', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', padding: '0 48px 64px', position: 'relative', zIndex: 10 }}>
        {['📅 Salary-cycle budgets','🏦 EMI health tracker','🤝 Flexible bill splitting','📊 Spending analytics','🛫 Salary runway','📱 Mobile OTP sign-up'].map(f => (
          <div key={f} style={{ background: '#111418', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '8px 18px', fontSize: '13px', color: '#8A95A3' }}>{f}</div>
        ))}
      </div>

      {/* Privacy / Trust */}
      <div style={{ padding: '64px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Your data. Your rules.</div>
          <div style={{ fontSize: '15px', color: '#8A95A3', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>Financial data is sensitive. Here's exactly how we protect yours — no vague promises.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px', maxWidth: '700px', margin: '0 auto 32px' }}>
          {[
            { icon: <Lock size={20} color="#00E5FF"/>, title: 'Encrypted in transit', desc: 'All data is sent over HTTPS with bank-grade TLS encryption. No one can intercept it between your device and our servers.' },
            { icon: <Eye size={20} color="#00D68F"/>, title: "We don't sell your data", desc: 'Your expenses, salary, and habits are never sold to advertisers or third parties. Period.' },
            { icon: <Trash2 size={20} color="#FF9500"/>, title: 'Delete anytime', desc: 'Delete your account and all your data is permanently wiped from our servers instantly. No backups kept.' },
            { icon: <Server size={20} color="#7C3AED"/>, title: 'Full encryption coming', desc: 'Client-side encryption is on our roadmap — your data will be encrypted before it ever leaves your device.' },
          ].map(item => (
            <div key={item.title} style={{ background: '#111418', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px', display: 'flex', gap: '14px' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: '#8A95A3', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)', borderRadius: '10px', padding: '14px 20px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#8A95A3' }}>
            <Shield size={16} color="#00E5FF"/>
            <span>Our encryption code will be <span style={{ color: '#00E5FF' }}>open-sourced on GitHub</span> so you can verify it yourself.</span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ padding: '64px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: '800', marginBottom: '16px' }}>Start tracking today.</div>
        <div style={{ fontSize: '15px', color: '#8A95A3', marginBottom: '32px' }}>Free forever. No credit card. No BS.</div>
        <button onClick={onGetStarted} style={{ background: '#00E5FF', color: '#000', border: 'none', padding: '16px 40px', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
          Open Moniq →
        </button>
      </div>
    </div>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────
function ExpenseModal({ onClose, onSave, categories }) {
  const [form, setForm] = useState({
    desc: '', amount: '', category: categories[0]?.name || 'Food',
    date: new Date().toISOString().split('T')[0],
    paidBy: 'You', notes: ''
  });
  const requiresNotes = form.category === 'Other';
  const isValid = form.desc && form.amount && !(requiresNotes && !form.notes);

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <button style={S.modalClose} onClick={onClose}>✕</button>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Add Expense</div>

        <label style={S.label}>Description</label>
        <input style={S.input} placeholder="e.g. Swiggy order" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}/>

        <label style={S.label}>Amount (₹)</label>
        <input style={S.input} type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}/>

        <label style={S.label}>Category</label>
        <select style={{ ...S.input }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
        </select>

        <label style={S.label}>
          Notes{' '}
          {requiresNotes
            ? <span style={{ color: '#FF3B5C', fontSize: '10px' }}>* required for Other</span>
            : <span style={{ color: '#3D4A57', fontSize: '10px' }}>(optional)</span>}
        </label>
        <input
          style={{ ...S.input, border: requiresNotes && !form.notes ? '1px solid rgba(255,59,92,0.5)' : '1px solid rgba(255,255,255,0.1)' }}
          placeholder={requiresNotes ? 'What did you spend on?' : 'Add a note...'}
          value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
        />

        <label style={S.label}>Date</label>
        <input
          style={S.input}
          type="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
        />
        <label style={S.label}>Paid By</label>
        <input style={S.input} placeholder="You" value={form.paidBy} onChange={e => setForm({ ...form, paidBy: e.target.value })}/>

        <button style={{ ...S.primaryBtn, opacity: isValid ? 1 : 0.5 }}
          onClick={() => { if (!isValid) return; onSave({ ...form, amount: Number(form.amount), id: Date.now() }); onClose(); }}>
          Add Expense →
        </button>
      </div>
    </div>
  );
}

// ─── Custom Category Modal ────────────────────────────────────────
function CategoryModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [color, setColor] = useState('#00E5FF');

  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: '380px' }}>
        <button style={S.modalClose} onClick={onClose}>✕</button>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>New Category</div>

        <label style={S.label}>Category Name</label>
        <input style={S.input} placeholder="e.g. Gym, Petrol, Books..." value={name} onChange={e => setName(e.target.value)}/>

        <label style={S.label}>Emoji</label>
        <input style={{ ...S.input, fontSize: '20px', textAlign: 'center' }} placeholder="Pick an emoji" value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}/>

        <label style={S.label}>Colour</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {PRESET_COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)}
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid white' : '3px solid transparent', transition: 'border 0.15s' }}/>
          ))}
        </div>

        {name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px' }}>{emoji}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color }}>{name}</span>
          </div>
        )}

        <button style={{ ...S.primaryBtn, opacity: !name ? 0.5 : 1 }}
          onClick={() => { if (!name) return; onSave({ name, emoji, color }); onClose(); }}>
          Create Category →
        </button>
      </div>
    </div>
  );
}

// ─── Budget Modal ─────────────────────────────────────────────────
function BudgetModal({ onClose, onSave, categories }) {
  const [budgets, setBudgets] = useState(categories.reduce((acc, c) => ({ ...acc, [c.name]: '' }), {}));

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <button style={S.modalClose} onClick={onClose}>✕</button>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Set Budgets</div>
        <div style={{ fontSize: '13px', color: '#8A95A3', marginBottom: '24px' }}>Set a monthly limit per category. Leave blank to skip.</div>
        <div style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '16px' }}>
          {categories.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px', width: '24px' }}>{c.emoji}</span>
              <span style={{ fontSize: '13px', flex: 1, color: '#8A95A3' }}>{c.name}</span>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#3D4A57', fontSize: '13px' }}>₹</span>
                <input type="number" placeholder="0" value={budgets[c.name]}
                  onChange={e => setBudgets({ ...budgets, [c.name]: e.target.value })}
                  style={{ ...S.input, marginBottom: 0, width: '120px', paddingLeft: '24px', fontSize: '13px' }}/>
              </div>
            </div>
          ))}
        </div>
        <button style={S.primaryBtn} onClick={() => { onSave(budgets); onClose(); }}>Save Budgets →</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState('landing');
  const [tab, setTab] = useState('dashboard');
  const [showSignUp, setShowSignUp] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showBudget, setShowBudget] = useState(false);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [salary, setSalary] = useState('');
  const [creditDay, setCreditDay] = useState(1);
  const [salarySet, setSalarySet] = useState(false);

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      setUser(firebaseUser);
      setScreen('app');
      // Load user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.salary) setSalary(data.salary);
        if (data.creditDay) setCreditDay(data.creditDay);
        if (data.salarySet) setSalarySet(data.salarySet);
      }
      // Load expenses
      const expSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'expenses'));
      const loaded = expSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setExpenses(loaded);
      // Load budgets
      const budgetDoc = await getDoc(doc(db, 'users', firebaseUser.uid, 'settings', 'budgets'));
      if (budgetDoc.exists()) setBudgets(budgetDoc.data());
    } else {
      setUser(null);
    }
    setAuthLoading(false);
  });
  return () => unsub();
}, []);
const handleSignIn = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error('Sign in error:', err);
  }
};

const handleSignOut = async () => {
  await signOut(auth);
  setUser(null);
  setExpenses([]);
  setBudgets({});
  setSalary('');
  setSalarySet(false);
  setScreen('landing');
};

const saveExpense = async (expense) => {
  if (user) {
    const ref = await addDoc(
      collection(db, 'users', user.uid, 'expenses'),
      expense
    );
    return { ...expense, id: ref.id };
  }
  return expense;
};

const deleteExpense = async (id) => {
  if (user) {
    await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
  }
  setExpenses(prev => prev.filter(x => x.id !== id));
};

const saveSalarySettings = async () => {
  if (!salary) return;
  setSalarySet(true);
  if (user) {
    await setDoc(doc(db, 'users', user.uid), {
      salary, creditDay, salarySet: true
    }, { merge: true });
  }
  setTab('dashboard');
};

const saveBudgets = async (b) => {
  setBudgets(b);
  if (user) {
    await setDoc(
      doc(db, 'users', user.uid, 'settings', 'budgets'),
      b
    );
  }
};
  const salaryNum = Number(salary) || 0;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = salaryNum - totalSpent;
  const daysInCycle = 30;
  const daysPassed = 9;
  const daysRemaining = daysInCycle - daysPassed;
  const dailyBudget = salaryNum > 0 && daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0;
  const avgDaily = daysPassed > 0 && totalSpent > 0 ? Math.round(totalSpent / daysPassed) : 0;
  const projected = avgDaily * daysInCycle;

  const pieData = categories
    .map(c => ({ name: c.name, value: expenses.filter(e => e.category === c.name).reduce((s, e) => s + e.amount, 0), color: c.color }))
    .filter(d => d.value > 0);

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'short' });
  const trendData = totalSpent > 0
  ? [{ month: currentMonth, amount: totalSpent }]
  : [];

  const navItems = [
    { id: 'dashboard',  label: 'Dashboard',   icon: <LayoutDashboard size={15}/> },
    { id: 'expenses',   label: 'Expenses',     icon: <ArrowUpDown size={15}/> },
    { id: 'budget',     label: 'Budget',       icon: <Target size={15}/> },
    { id: 'emi',        label: 'EMI Tracker',  icon: <Building2 size={15}/> },
    { id: 'split',      label: 'Split',        icon: <Users size={15}/> },
    { id: 'salary',     label: 'Salary Cycle', icon: <Calendar size={15}/> },
  ];

  const ordinal = (n) => `${n}${n===1?'st':n===2?'nd':n===3?'rd':'th'}`;

  if (authLoading) return (
  <div style={{ background: '#07080A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#00E5FF', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
  </div>
);
  if (screen === 'landing') return <LandingPage onGetStarted={() => setScreen('app')}/>;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}><div style={S.logoDot}/>Moniq</div>
        <nav style={S.sidebarNav}>
          {navItems.map(item => (
            <div key={item.id} style={S.navItem(tab === item.id)} onClick={() => setTab(item.id)}>
              {item.icon}{item.label}
            </div>
          ))}
        </nav>
        <div style={S.sidebarBottom}>
          <div style={S.guestCard} onClick={() => user ? handleSignOut() : setShowSignUp(true)}></div>
            <div style={S.guestAvatar}>👤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: user ? '#EAEEF2' : '#8A95A3' }}>
                {user ? user.displayName?.split(' ')[0] : 'Guest'}
            </div>
            <div style={{ fontSize: '11px', color: '#3D4A57' }}>
              {user ? user.email : 'Sign up to save data'}
            </div>
            <ChevronRight size={14} color="#3D4A57"/>
          </div>
        </div>
      </aside>

      {/* Save Banner */}
      <div style={S.banner}>
        <span>💾 Your session data will be lost when you close this tab.</span>
        {!user && (
  <>
    <strong style={{ color: '#00E5FF' }}>Sign up free to save everything.</strong>
    <button style={S.bannerBtn} onClick={() => setShowSignUp(true)}>Save my data →</button>
  </>
)}
{user && (
  <strong style={{ color: '#00D68F' }}>✓ {user.displayName?.split(' ')[0]} · All data saved</strong>
)}
        
      </div>

      <main style={S.main}>
        <div style={S.content}>

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div>
              <div style={S.pageHeader}>
                <div>
                  <div style={S.pageTitle}>Dashboard</div>
                  <div style={S.pageSub}>{salarySet ? `Salary cycle · ${daysRemaining} days remaining` : 'Add expenses and set budgets to get started'}</div>
                </div>
                <button style={S.addBtn} onClick={() => setShowAddExpense(true)}><Plus size={13}/>Add Expense</button>
              </div>

              {!salarySet && (
                <div style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: '12px', padding: '18px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#00E5FF', marginBottom: '4px' }}>Set up your salary cycle</div>
                    <div style={{ fontSize: '13px', color: '#8A95A3' }}>Unlock daily budget, runway predictions and spending insights.</div>
                  </div>
                  <button style={S.addBtn} onClick={() => setTab('salary')}>Set up →</button>
                </div>
              )}

              {expenses.length === 0 ? (
                <div style={{ ...S.card, padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '14px' }}>📊</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>No expenses yet</div>
                  <div style={{ fontSize: '13px', color: '#8A95A3', marginBottom: '20px' }}>Add your first expense and your dashboard will come to life.</div>
                  <button style={S.addBtn} onClick={() => setShowAddExpense(true)}><Plus size={13}/>Add first expense</button>
                </div>
              ) : (
                <>
                  {projected > salaryNum && salaryNum > 0 && (
                    <div style={S.warningCard}>
                      <AlertTriangle size={18} color="#FF9500" style={{ flexShrink: 0, marginTop: '1px' }}/>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF9500', marginBottom: '3px' }}>Spending faster than your cycle pace</div>
                        <div style={{ fontSize: '12px', color: '#8A95A3' }}>At your current rate you'll spend ₹{projected.toLocaleString('en-IN')} — ₹{(projected-salaryNum).toLocaleString('en-IN')} over your salary.</div>
                      </div>
                    </div>
                  )}

                  <div style={S.kpiGrid}>
                    {[
                      { label: 'Cycle Spent',     value: `₹${totalSpent.toLocaleString('en-IN')}`,                                 sub: salaryNum ? `of ₹${salaryNum.toLocaleString('en-IN')} salary` : 'Set salary for %',  color: '#00E5FF' },
                      { label: 'Remaining',        value: salaryNum ? `₹${remaining.toLocaleString('en-IN')}` : '—',               sub: `${daysRemaining} days to salary`,                                                    color: '#00D68F' },
                      { label: 'Daily Budget',     value: dailyBudget > 0 ? `₹${dailyBudget.toLocaleString('en-IN')}` : '—',       sub: 'per day remaining',                                                                  color: '#FF9500' },
                      { label: 'Avg Daily Spend',  value: avgDaily > 0 ? `₹${avgDaily.toLocaleString('en-IN')}` : '—',             sub: `last ${daysPassed} days`,                                                            color: '#FFB800' },
                    ].map(k => (
                      <div key={k.label} style={S.kpiCard(k.color)}>
                        <div style={S.kpiLabel}>{k.label}</div>
                        <div style={S.kpiValue(k.color)}>{k.value}</div>
                        <div style={S.kpiSub}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={S.chartGrid}>
                    <div style={S.chartCard}>
                      <div style={S.chartTitle}>SPENDING BREAKDOWN <span style={S.chartBadge}>This cycle</span></div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                          </Pie>
                          <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#111418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#EAEEF2' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={S.chartCard}>
                      <div style={S.chartTitle}>MONTHLY TREND <span style={S.chartBadge}>6 months</span></div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                          <XAxis dataKey="month" tick={{ fill: '#3D4A57', fontSize: 11 }} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fill: '#3D4A57', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`}/>
                          <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#111418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#EAEEF2' }}/>
                          <Line type="monotone" dataKey="amount" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 3 }}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {salaryNum > 0 && (
                    <div style={S.chartCard}>
                      <div style={S.chartTitle}>SALARY CYCLE PROGRESS</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ color: '#00E5FF' }}>Spent: ₹{totalSpent.toLocaleString('en-IN')} ({Math.round(totalSpent/salaryNum*100)}%)</span>
                        <span style={{ color: '#3D4A57' }}>Salary: ₹{salaryNum.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={S.progTrack}>
                        <div style={S.progFill(Math.round(totalSpent/salaryNum*100), 'linear-gradient(90deg,#00E5FF,#0066FF)')}/>
                      </div>
                      <div style={{ fontSize: '12px', color: '#3D4A57', marginTop: '8px' }}>{daysPassed} of {daysInCycle} days passed · {daysRemaining} remaining</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── EXPENSES ── */}
          {tab === 'expenses' && (
            <div>
              <div style={S.pageHeader}>
                <div>
                  <div style={S.pageTitle}>Expenses</div>
                  <div style={S.pageSub}>{expenses.length} transactions · ₹{totalSpent.toLocaleString('en-IN')} this cycle</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ background: '#131619', border: '1px solid rgba(255,255,255,0.06)', color: '#8A95A3', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Download size={13}/>Export CSV
                  </button>
                  <button style={S.addBtn} onClick={() => setShowAddExpense(true)}><Plus size={13}/>Add Expense</button>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#8A95A3', marginBottom: '8px' }}>No expenses yet</div>
                  <div style={{ fontSize: '13px', marginBottom: '24px' }}>Add your first expense to start tracking your spending.</div>
                  <button style={S.addBtn} onClick={() => setShowAddExpense(true)}><Plus size={13}/>Add first expense</button>
                </div>
              ) : (
                <div style={S.card}>
                  <table style={S.table}>
                    <thead>
                      <tr>{['Description','Category','Amount','Notes','Date','Paid By',''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => {
                        const cat = categories.find(c => c.name === e.category);
                        return (
                          <tr key={e.id}>
                            <td style={S.td}><span style={{ fontWeight: 500 }}>{e.desc}</span></td>
                            <td style={S.td}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `${cat?.color || '#8A95A3'}20`, color: cat?.color || '#8A95A3' }}>
                                {cat?.emoji} {e.category}
                              </span>
                            </td>
                            <td style={S.td}><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{e.amount.toLocaleString('en-IN')}</span></td>
                            <td style={{ ...S.td, color: '#3D4A57', fontSize: '12px', maxWidth: '160px' }}>{e.notes || '—'}</td>
                            <td style={{ ...S.td, color: '#3D4A57' }}>{e.date}</td>
                            <td style={{ ...S.td, color: e.paidBy === 'You' ? '#00E5FF' : '#8A95A3' }}>{e.paidBy}</td>
                            <td style={S.td}>
                              <button onClick={() => deleteExpense(e.id)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3D4A57', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                                title="Delete">
                                <Trash2 size={14}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add custom category FAB */}
              <button onClick={() => setShowCategory(true)}
                style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#131619', border: '1px solid rgba(255,255,255,0.1)', color: '#8A95A3', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 500 }}>
                <Plus size={13}/> New Category
              </button>
            </div>
          )}

          {/* ── BUDGET ── */}
          {tab === 'budget' && (
            <div>
              <div style={S.pageHeader}>
                <div>
                  <div style={S.pageTitle}>Budget</div>
                  <div style={S.pageSub}>Set monthly limits per category</div>
                </div>
                <button style={S.addBtn} onClick={() => setShowBudget(true)}><Settings size={13}/>Set Budgets</button>
              </div>

              {Object.values(budgets).every(v => !Number(v)) ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#8A95A3', marginBottom: '8px' }}>No budgets set</div>
                  <div style={{ fontSize: '13px', marginBottom: '24px' }}>Set monthly limits to track how you're spending against your goals.</div>
                  <button style={S.addBtn} onClick={() => setShowBudget(true)}><Settings size={13}/>Set budgets</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
                  {Object.entries(budgets).filter(([_, v]) => Number(v) > 0).map(([catName, limit]) => {
                    const cat = categories.find(c => c.name === catName);
                    const spent = expenses.filter(e => e.category === catName).reduce((s, e) => s + e.amount, 0);
                    const pct = Math.round(spent / Number(limit) * 100);
                    const over = spent > Number(limit);
                    const color = over ? '#FF3B5C' : pct > 80 ? '#FF9500' : cat?.color || '#00E5FF';
                    return (
                      <div key={catName} style={{ ...S.card, padding: '18px', border: over ? '1px solid rgba(255,59,92,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{cat?.emoji}</span>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600' }}>{catName}</div>
                              {over && <span style={{ fontSize: '10px', fontWeight: '700', color: '#FF3B5C', background: 'rgba(255,59,92,0.1)', padding: '1px 6px', borderRadius: '20px' }}>OVER BUDGET</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '800', color }}>₹{spent.toLocaleString('en-IN')}</span>
                            <span style={{ fontSize: '12px', color: '#3D4A57' }}> / ₹{Number(limit).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div style={S.progTrack}><div style={S.progFill(pct, color)}/></div>
                        <div style={{ fontSize: '11px', color: over ? '#FF3B5C' : '#3D4A57', marginTop: '6px' }}>
                          {over ? `₹${(spent-Number(limit)).toLocaleString('en-IN')} over budget` : `${pct}% used · ₹${(Number(limit)-spent).toLocaleString('en-IN')} remaining`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SALARY ── */}
          {tab === 'salary' && (
            <div>
              <div style={S.pageHeader}>
                <div>
                  <div style={S.pageTitle}>Salary Cycle</div>
                  <div style={S.pageSub}>Your budget resets on your salary date, not Jan 1</div>
                </div>
              </div>

              {projected > salaryNum && salaryNum > 0 && (
                <div style={S.warningCard}>
                  <AlertTriangle size={18} color="#FF9500" style={{ flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF9500', marginBottom: '3px' }}>Projected overspend this cycle</div>
                    <div style={{ fontSize: '12px', color: '#8A95A3' }}>At ₹{avgDaily.toLocaleString('en-IN')}/day average, you'll spend ₹{projected.toLocaleString('en-IN')} — ₹{(projected-salaryNum).toLocaleString('en-IN')} over your salary.</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ ...S.card, padding: '24px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Salary Settings</div>

                  <label style={S.label}>Monthly Salary</label>
                  <div style={{ position: 'relative', marginBottom: '4px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#00E5FF', fontFamily: 'monospace' }}>₹</span>
                    <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="Enter your salary"
                      style={{ ...S.input, paddingLeft: '28px', marginBottom: 0 }}/>
                  </div>
                  <input type="range" min="10000" max="500000" step="5000" value={salary || 10000}
                    onChange={e => setSalary(e.target.value)}
                    style={{ width: '100%', accentColor: '#00E5FF', marginBottom: '4px' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#3D4A57', marginBottom: '20px' }}>
                    <span>₹10k</span><span>₹5L</span>
                  </div>

                  <label style={S.label}>Salary Credit Day: <span style={{ color: '#00E5FF' }}>{ordinal(creditDay)} of month</span></label>
                  <input type="range" min="1" max="31" value={creditDay} onChange={e => setCreditDay(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#00E5FF', marginBottom: '4px' }}/>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#3D4A57', marginBottom: '24px' }}>
                    <span>1st</span><span>15th</span><span>31st</span>
                  </div>

                  <button style={{ ...S.primaryBtn, opacity: salary ? 1 : 0.5 }}
                    onClick={saveSalarySettings}>
                    Save & Go to Dashboard →
                  </button>
                </div>

                <div style={{ ...S.card, padding: '24px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Cycle Stats</div>
                  {[
                    ['Monthly Salary',   salaryNum > 0 ? `₹${salaryNum.toLocaleString('en-IN')}` : 'Not set yet', false],
                    ['Credit Day',       salarySet ? ordinal(creditDay) + ' of month' : 'Not set yet', false],
                    ['Days Passed',      `${daysPassed} days`, false],
                    ['Days Remaining',   `${daysRemaining} days`, false],
                    ['Spent This Cycle', `₹${totalSpent.toLocaleString('en-IN')}`, false],
                    ['Daily Budget',     dailyBudget > 0 ? `₹${dailyBudget.toLocaleString('en-IN')}/day` : '—', false],
                    ['Projected Total',  projected > 0 ? `₹${projected.toLocaleString('en-IN')}` : '—', projected > salaryNum && salaryNum > 0],
                  ].map(([k, v, warn], i, arr) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: '13px' }}>
                      <span style={{ color: '#3D4A57' }}>{k}</span>
                      <span style={{ fontFamily: 'monospace', color: warn ? '#FF9500' : '#EAEEF2' }}>{v}{warn ? ' ⚠' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EMI Placeholder ── */}
          {tab === 'emi' && (
            <div style={S.emptyState}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏦</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#8A95A3', marginBottom: '8px' }}>EMI Tracker coming soon</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>Add your loans and track your debt health score.<br/>Know exactly how much your EMIs cost you over time.</div>
            </div>
          )}

          {/* ── Split Placeholder ── */}
          {tab === 'split' && (
            <div style={S.emptyState}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤝</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#8A95A3', marginBottom: '8px' }}>Split coming soon</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>Split expenses with custom amounts per person.<br/>Add names, amounts, and purpose notes — no forced equal split.</div>
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      {showSignUp && (
  <div style={S.overlay}>
    <div style={S.modal}>
      <button style={S.modalClose} onClick={() => setShowSignUp(false)}>✕</button>
      <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>💸 Moniq</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: '800', lineHeight: 1.2, marginBottom: '8px' }}>Save your<br/>financial data.</div>
      <div style={{ fontSize: '13px', color: '#8A95A3', marginBottom: '32px', lineHeight: 1.5 }}>Sign in with Google to save your expenses, budgets and salary settings — securely and permanently.</div>
      <button
        onClick={() => { handleSignIn(); setShowSignUp(false); }}
        style={{ width: '100%', background: 'white', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google"/>
        Continue with Google
      </button>
      <div style={{ textAlign: 'center', fontSize: '11px', color: '#3D4A57', marginTop: '14px' }}>By continuing you agree to our Privacy Policy & Terms</div>
    </div>
  </div>
)}
      {showAddExpense && <ExpenseModal   onClose={() => setShowAddExpense(false)} onSave={async (e) => {
  const saved = await saveExpense(e);
  setExpenses(prev => [saved, ...prev]);
}}categories={categories}/>}
      {showCategory   && <CategoryModal onClose={() => setShowCategory(false)}   onSave={c => setCategories(prev => [...prev, c])}/>}
      {showBudget     && <BudgetModal   onClose={() => setShowBudget(false)}     onSave={saveBudgets} categories={categories}/>}
    </div>
  );
}