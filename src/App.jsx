import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const PRODUCTS = ['Life', 'Term', 'Health', 'Hospitalisation'];

const COLORS = {
  ink: '#16233A',
  inkSoft: '#5B6472',
  paper: '#EEF1F3',
  card: '#FFFFFF',
  line: '#D7DCE0',
  brass: '#9C7A3C',
  brassSoft: '#EFE6D2',
  emerald: '#2E6B52',
  emeraldSoft: '#DCEAE2',
  brick: '#A6433A',
  brickSoft: '#F1DCD8',
};


function formatINR(n) { return '\u20B9' + n.toLocaleString('en-IN'); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function hasActive(customer, product) { return customer.policies.some((p) => p.product === product && p.status === 'Active'); }
function gapProducts(customer) { return PRODUCTS.filter((p) => !hasActive(customer, p)); }
function activePolicies(customer) { return customer.policies.filter((p) => p.status === 'Active'); }
function totalSumInsured(customer) { return activePolicies(customer).reduce((sum, p) => sum + p.sumInsured, 0); }
function totalPremium(customer) { return activePolicies(customer).reduce((sum, p) => sum + p.premium, 0); }
function daysUntil(d) { return Math.round((new Date(d).getTime() - Date.now()) / 86400000); }
function upcomingRenewals(customers, withinDays = 45) {
  const list = [];
  customers.forEach((c) => {
    c.policies.forEach((p) => {
      if (p.status !== 'Active' || !p.renewalDate) return;
      const days = daysUntil(p.renewalDate);
      if (days >= 0 && days <= withinDays) list.push({ customer: c.name, customerId: c.id, product: p.product, renewalDate: p.renewalDate, days });
    });
  });
  return list.sort((a, b) => a.days - b.days);
}
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'customers', label: 'Customers' },
  { key: 'cases', label: 'Customer Case History' },
  { key: 'report', label: 'Report' },
  { key: 'settings', label: 'Settings' },
];

const cardShell = { background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 6, boxShadow: '0 1px 2px rgba(22,35,58,0.05)' };

function Card({ title, action, children, style }) {
  return (
    <div style={{ ...cardShell, ...style }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${COLORS.line}` }}>
          <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h3>
          {action}
        </div>
      )}
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, margin: 0 }}>{title}</h1>
      {subtitle && <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function Sidebar({ activePage, setActivePage }) {
  return (
    <div className="c360-sidebar" style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${COLORS.line}`, background: COLORS.card, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '22px 20px 20px' }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 21, fontWeight: 600 }}>Client 360</div>
        <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>Insurance relationship dashboard</div>
      </div>
      <nav style={{ borderTop: `1px solid ${COLORS.line}`, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 20px 10px 17px',
                border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14,
                color: isActive ? COLORS.brass : COLORS.ink, fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? `3px solid ${COLORS.brass}` : '3px solid transparent',
                background: isActive ? '#F7F8F5' : 'transparent',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: `1px solid ${COLORS.line}`, fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>
        Aisha Rahman<br />Relationship Manager
      </div>
    </div>
  );
}

function HomePage({ customers, cases, setActivePage }) {
  const totalPremiumBook = customers.reduce((sum, c) => sum + totalPremium(c), 0);
  const openCases = cases.filter((c) => c.status === 'Open').length;
  const gapClients = customers.filter((c) => gapProducts(c).length > 0).sort((a, b) => gapProducts(b).length - gapProducts(a).length).slice(0, 5);
  const renewals = upcomingRenewals(customers).slice(0, 5);
  const recentCases = [...cases].sort((a, b) => new Date(b.opened) - new Date(a.opened)).slice(0, 5);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const kpis = [
    ['Clients', customers.length],
    ['Open cases', openCases],
    ['Coverage gaps', customers.filter((c) => gapProducts(c).length > 0).length],
    ['Annual premium book', formatINR(totalPremiumBook)],
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{today}</div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, margin: '4px 0 0' }}>{greeting()}, Aisha</h1>
        <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>Here's what's happening across your client book today.</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        {kpis.map(([label, val]) => (
          <div key={label} style={{ ...cardShell, flex: '1 1 200px', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{label}</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 600, marginTop: 6 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <Card title="Coverage gaps" action={<button onClick={() => setActivePage('customers')} className="c360-link">See all</button>}>
          {gapClients.length === 0 && <div style={{ fontSize: 13, color: COLORS.inkSoft }}>No coverage gaps across your book.</div>}
          {gapClients.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${COLORS.line}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{gapProducts(c).join(', ')}</div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, background: COLORS.brickSoft, color: COLORS.brick, flexShrink: 0 }}>{gapProducts(c).length} gap{gapProducts(c).length > 1 ? 's' : ''}</span>
            </div>
          ))}
        </Card>

        <Card title="Upcoming renewals" action={<span style={{ fontSize: 11, color: COLORS.inkSoft }}>Next 45 days</span>}>
          {renewals.length === 0 && <div style={{ fontSize: 13, color: COLORS.inkSoft }}>No renewals due soon.</div>}
          {renewals.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.customer}</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{r.product} · renews {formatDate(r.renewalDate)}</div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, background: COLORS.brassSoft, color: COLORS.brass, flexShrink: 0 }}>{r.days}d</span>
            </div>
          ))}
        </Card>

        <Card title="Recent cases" action={<button onClick={() => setActivePage('cases')} className="c360-link">See all</button>}>
          {recentCases.length === 0 && <div style={{ fontSize: 13, color: COLORS.inkSoft }}>No cases on record.</div>}
          {recentCases.map((cs, i) => (
            <div key={cs.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{cs.customer}</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{cs.subject}</div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2,
                background: cs.status === 'Resolved' ? COLORS.emeraldSoft : cs.status === 'Open' ? COLORS.brickSoft : COLORS.brassSoft,
                color: cs.status === 'Resolved' ? COLORS.emerald : cs.status === 'Open' ? COLORS.brick : COLORS.brass, flexShrink: 0 }}>{cs.status}</span>
            </div>
          ))}
        </Card>

        <Card title="Product mix" action={<button onClick={() => setActivePage('report')} className="c360-link">Full report</button>}>
          {PRODUCTS.map((product) => {
            const count = customers.filter((c) => hasActive(c, product)).length;
            const max = Math.max(...PRODUCTS.map((p) => customers.filter((c) => hasActive(c, p)).length), 1);
            return (
              <div key={product} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{product}</span><span style={{ color: COLORS.inkSoft }}>{count}</span>
                </div>
                <div style={{ height: 5, background: '#EEF0EE' }}><div style={{ height: '100%', width: `${(count / max) * 100}%`, background: COLORS.brass }} /></div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function CustomersPage({ customers, onSaveCustomer }) {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [gapOnly, setGapOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(customers[0] ? customers[0].id : null);
  const [expanded, setExpanded] = useState(new Set());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (segmentFilter !== 'All' && c.segment !== segmentFilter) return false;
      if (gapOnly && gapProducts(c).length === 0) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.city.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [customers, search, segmentFilter, gapOnly]);

  const customer = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  function toggleExpand(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function selectCustomer(id) {
    setSelectedId(id);
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  }

  function startEdit() {
    setDraft({ name: customer.name, age: customer.age, gender: customer.gender, city: customer.city, phone: customer.phone, email: customer.email });
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
    setSaveError(null);
  }

  async function saveEdit() {
    if (!draft || !draft.name.trim() || !draft.city.trim() || !draft.phone.trim() || !draft.email.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveCustomer(customer.id, draft);
      setEditing(false);
      setDraft(null);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  const canSave = draft && draft.name.trim() && draft.city.trim() && draft.phone.trim() && draft.email.trim();
  const fieldInputStyle = { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, border: 'none', borderBottom: `1px solid ${COLORS.brass}`, padding: '1px 2px', background: 'transparent', outline: 'none', color: COLORS.ink };

  return (
    <div>
      <PageHeader title="Customers" subtitle="Search your assigned client portfolio and product holdings" />
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 280, flexShrink: 0, border: `1px solid ${COLORS.line}` }}>
          <div style={{ padding: '14px 16px 10px' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or city"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: `1px solid ${COLORS.line}`, borderRadius: 2, fontFamily: "'IBM Plex Sans', sans-serif" }} />
          </div>
          <div style={{ padding: '0 16px 10px', display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
            {['All', 'Platinum', 'Gold', 'Silver'].map((seg) => (
              <button key={seg} className="c360-chip" onClick={() => setSegmentFilter(seg)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: segmentFilter === seg ? COLORS.brass : COLORS.inkSoft, fontWeight: segmentFilter === seg ? 600 : 400,
                  borderBottom: segmentFilter === seg ? `2px solid ${COLORS.brass}` : '2px solid transparent', paddingBottom: 3 }}>
                {seg}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 12px', fontSize: 12, color: COLORS.inkSoft, cursor: 'pointer' }}>
            <input type="checkbox" checked={gapOnly} onChange={(e) => setGapOnly(e.target.checked)} />
            Coverage gaps only
          </label>
          <div className="c360-scroll" style={{ maxHeight: 480, overflowY: 'auto', borderTop: `1px solid ${COLORS.line}` }}>
            {filtered.length === 0 && <div style={{ padding: 18, fontSize: 13, color: COLORS.inkSoft }}>No clients match these filters.</div>}
            {filtered.map((c) => {
              const gaps = gapProducts(c);
              const isSelected = customer && c.id === customer.id;
              return (
                <div key={c.id} className="c360-row" onClick={() => selectCustomer(c.id)}
                  style={{ padding: '11px 16px', cursor: 'pointer', borderLeft: isSelected ? `3px solid ${COLORS.brass}` : '3px solid transparent',
                    background: isSelected ? '#F7F8F5' : 'transparent', borderBottom: `1px solid ${COLORS.line}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: "'Newsreader', serif", fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: gaps.length === 0 ? COLORS.emerald : COLORS.brass, flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{c.city} · {c.segment}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: '1 1 480px', minWidth: 320 }}>
          {!customer && <div style={{ fontSize: 14, color: COLORS.inkSoft }}>No client selected.</div>}
          {customer && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {editing ? (
                      <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, border: 'none', borderBottom: `2px solid ${COLORS.brass}`, padding: '2px 0', background: 'transparent', outline: 'none', minWidth: 220, color: COLORS.ink }} />
                    ) : (
                      <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, margin: 0 }}>{customer.name}</h2>
                    )}
                    <span style={{ fontSize: 11, padding: '3px 8px', border: `1px solid ${COLORS.brass}`, color: COLORS.brass, borderRadius: 2 }}>{customer.segment}</span>
                  </div>
                  {editing ? (
                    <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <input type="number" value={draft.age} onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))} style={{ ...fieldInputStyle, width: 40 }} /> yrs
                      <span>·</span>
                      <select value={draft.gender} onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))} style={fieldInputStyle}>
                        <option value="F">F</option>
                        <option value="M">M</option>
                      </select>
                      <span>·</span>
                      <input value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} style={{ ...fieldInputStyle, width: 120 }} />
                      <span>· Client since {customer.customerSince}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6 }}>{customer.age} yrs · {customer.gender} · {customer.city} · Client since {customer.customerSince}</div>
                  )}
                  {editing ? (
                    <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} style={{ ...fieldInputStyle, width: 150 }} />
                      <span>·</span>
                      <input type="email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} style={{ ...fieldInputStyle, width: 200 }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>{customer.phone} · {customer.email}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {justSaved && <span style={{ fontSize: 12, color: COLORS.emerald }}>Saved</span>}
                    {saveError && <span style={{ fontSize: 12, color: COLORS.brick }}>{saveError}</span>}
                    {!editing ? (
                      <button onClick={startEdit} style={{ padding: '8px 16px', fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", border: `1px solid ${COLORS.brass}`, color: COLORS.brass, background: 'transparent', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    ) : (
                      <>
                        <button onClick={cancelEdit} disabled={saving} style={{ padding: '8px 16px', fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", border: `1px solid ${COLORS.line}`, color: COLORS.inkSoft, background: 'transparent', borderRadius: 2, cursor: saving ? 'not-allowed' : 'pointer' }}>Cancel</button>
                        <button onClick={saveEdit} disabled={!canSave || saving} style={{ padding: '8px 16px', fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", border: 'none', color: '#fff', background: canSave && !saving ? COLORS.brass : '#C9BDA3', borderRadius: 2, cursor: canSave && !saving ? 'pointer' : 'not-allowed', fontWeight: 600 }}>{saving ? 'Saving…' : 'Save'}</button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 400px', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Card title="Product holdings">
                    <div style={{ border: `1px solid ${COLORS.line}`, margin: -18, marginTop: 0 }}>
                      {PRODUCTS.map((product, idx) => {
                        const policy = customer.policies.find((p) => p.product === product && p.status === 'Active') || customer.policies.find((p) => p.product === product);
                        const key = `${customer.id}-${product}`;
                        const isOpen = expanded.has(key);
                        const statusLabel = policy ? policy.status : 'Not held';
                        const statusColor = statusLabel === 'Active' ? COLORS.emerald : statusLabel === 'Lapsed' ? COLORS.brick : COLORS.inkSoft;
                        const statusBg = statusLabel === 'Active' ? COLORS.emeraldSoft : statusLabel === 'Lapsed' ? COLORS.brickSoft : '#EEF0EE';
                        return (
                          <div key={product} style={{ borderTop: idx > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
                            <div className="c360-prow" onClick={() => toggleExpand(key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', flexWrap: 'wrap', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{product}</span>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, background: statusBg, color: statusColor }}>{statusLabel}</span>
                              </div>
                              {policy ? (
                                <div style={{ fontSize: 12, color: COLORS.inkSoft, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                  <span>Sum insured {formatINR(policy.sumInsured)}</span>
                                  <span>Premium {formatINR(policy.premium)}/yr</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: COLORS.brick }}>Coverage gap — candidate for cross-sell</span>
                              )}
                            </div>
                            {isOpen && (
                              <div style={{ padding: '0 16px 14px', fontSize: 12, color: COLORS.inkSoft }}>
                                {policy ? (
                                  <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                                    <span>Policy no. {policy.policyNumber}</span>
                                    <span>Start {formatDate(policy.startDate)}</span>
                                    <span>{policy.status === 'Active' ? 'Renews' : 'Lapsed on'} {formatDate(policy.renewalDate)}</span>
                                  </div>
                                ) : <span>No policy on record for this product.</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Claims history">
                    {customer.claims.length === 0 ? (
                      <div style={{ fontSize: 13, color: COLORS.inkSoft }}>No claims on record for this client.</div>
                    ) : (
                      <div style={{ overflowX: 'auto', margin: -18, marginTop: 0, padding: '0 18px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
                          <thead>
                            <tr style={{ borderBottom: `1px solid ${COLORS.line}`, textAlign: 'left', color: COLORS.inkSoft }}>
                              <th style={{ padding: '8px 10px', fontWeight: 500 }}>Date</th>
                              <th style={{ padding: '8px 10px', fontWeight: 500 }}>Product</th>
                              <th style={{ padding: '8px 10px', fontWeight: 500 }}>Type</th>
                              <th style={{ padding: '8px 10px', fontWeight: 500 }}>Amount</th>
                              <th style={{ padding: '8px 10px', fontWeight: 500 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customer.claims.map((cl) => (
                              <tr key={cl.id} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                                <td style={{ padding: '9px 10px' }}>{formatDate(cl.date)}</td>
                                <td style={{ padding: '9px 10px' }}>{cl.product}</td>
                                <td style={{ padding: '9px 10px' }}>{cl.type}</td>
                                <td style={{ padding: '9px 10px' }}>{formatINR(cl.amount)}</td>
                                <td style={{ padding: '9px 10px' }}>
                                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2,
                                    background: cl.status === 'Approved' ? COLORS.emeraldSoft : cl.status === 'Rejected' ? COLORS.brickSoft : COLORS.brassSoft,
                                    color: cl.status === 'Approved' ? COLORS.emerald : cl.status === 'Rejected' ? COLORS.brick : COLORS.brass }}>{cl.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>

                <div style={{ flex: '1 1 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Card title="Overview">
                    {[
                      ['Active policies', activePolicies(customer).length, false],
                      ['Total sum insured', formatINR(totalSumInsured(customer)), false],
                      ['Annual premium', formatINR(totalPremium(customer)), false],
                      ['Coverage gaps', gapProducts(customer).length, true],
                    ].map(([label, val, flagGap], i) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: i > 0 ? '10px 0' : '0 0 10px', borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
                        <span style={{ fontSize: 12, color: COLORS.inkSoft }}>{label}</span>
                        <span style={{ fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 600, color: flagGap && gapProducts(customer).length > 0 ? COLORS.brick : COLORS.ink }}>{val}</span>
                      </div>
                    ))}
                  </Card>

                  <Card title="Client details">
                    {[
                      ['Last contacted', formatDate(customer.lastContact)],
                      ['Client since', customer.customerSince],
                      ['City', customer.city],
                      ['Phone', customer.phone],
                      ['Email', customer.email],
                    ].map(([label, val], i) => (
                      <div key={label} style={{ padding: i > 0 ? '10px 0' : '0 0 10px', borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
                        <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{label}</div>
                        <div style={{ fontSize: 13, marginTop: 2, wordBreak: 'break-word' }}>{val}</div>
                      </div>
                    ))}
                  </Card>

                  {gapProducts(customer).length > 0 && (
                    <Card title="Coverage gaps">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {gapProducts(customer).map((p) => (
                          <span key={p} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 2, background: COLORS.brickSoft, color: COLORS.brick }}>{p} — candidate for cross-sell</span>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CasesPage({ cases }) {
  const open = cases.filter((c) => c.status === 'Open').length;
  const inProgress = cases.filter((c) => c.status === 'In progress').length;
  const resolved = cases.filter((c) => c.status === 'Resolved').length;
  return (
    <div>
      <PageHeader title="Customer Case History" subtitle="Service requests and inquiries across your book" />
      <div style={{ display: 'flex', flexWrap: 'wrap', border: `1px solid ${COLORS.line}`, marginBottom: 28 }}>
        {[['Open', open], ['In progress', inProgress], ['Resolved', resolved]].map(([label, val], i) => (
          <div key={label} style={{ flex: '1 1 120px', padding: '14px 18px', borderLeft: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{label}</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.line}`, textAlign: 'left', color: COLORS.inkSoft }}>
              <th style={{ padding: '8px 12px', fontWeight: 500 }}>Case</th>
              <th style={{ padding: '8px 12px', fontWeight: 500 }}>Client</th>
              <th style={{ padding: '8px 12px', fontWeight: 500 }}>Subject</th>
              <th style={{ padding: '8px 12px', fontWeight: 500 }}>Category</th>
              <th style={{ padding: '8px 12px', fontWeight: 500 }}>Opened</th>
              <th style={{ padding: '8px 12px', fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((cs) => (
              <tr key={cs.id} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                <td style={{ padding: '10px 12px' }}>{cs.id}</td>
                <td style={{ padding: '10px 12px' }}>{cs.customer}</td>
                <td style={{ padding: '10px 12px' }}>{cs.subject}</td>
                <td style={{ padding: '10px 12px' }}>{cs.category}</td>
                <td style={{ padding: '10px 12px' }}>{formatDate(cs.opened)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2,
                    background: cs.status === 'Resolved' ? COLORS.emeraldSoft : cs.status === 'Open' ? COLORS.brickSoft : COLORS.brassSoft,
                    color: cs.status === 'Resolved' ? COLORS.emerald : cs.status === 'Open' ? COLORS.brick : COLORS.brass }}>{cs.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportPage({ customers }) {
  const totalClients = customers.length;
  const totalActivePolicies = customers.reduce((sum, c) => sum + activePolicies(c).length, 0);
  const totalBookSumInsured = customers.reduce((sum, c) => sum + totalSumInsured(c), 0);
  const totalBookPremium = customers.reduce((sum, c) => sum + totalPremium(c), 0);
  const productMix = PRODUCTS.map((product) => ({ product, count: customers.filter((c) => hasActive(c, product)).length }));
  const maxProductCount = Math.max(...productMix.map((p) => p.count), 1);
  const segmentMix = ['Platinum', 'Gold', 'Silver'].map((segment) => ({ segment, count: customers.filter((c) => c.segment === segment).length }));
  const maxSegmentCount = Math.max(...segmentMix.map((s) => s.count), 1);

  return (
    <div>
      <PageHeader title="Report" subtitle="Portfolio summary across your assigned clients" />
      <div style={{ display: 'flex', flexWrap: 'wrap', border: `1px solid ${COLORS.line}`, marginBottom: 32 }}>
        {[['Clients', totalClients], ['Active policies', totalActivePolicies], ['Total sum insured', formatINR(totalBookSumInsured)], ['Total annual premium', formatINR(totalBookPremium)]].map(([label, val], i) => (
          <div key={label} style={{ flex: '1 1 160px', padding: '16px 20px', borderLeft: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{label}</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px' }}>
          <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Product mix</h3>
          {productMix.map((p) => (
            <div key={p.product} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{p.product}</span><span style={{ color: COLORS.inkSoft }}>{p.count} clients</span>
              </div>
              <div style={{ height: 6, background: '#EEF0EE' }}><div style={{ height: '100%', width: `${(p.count / maxProductCount) * 100}%`, background: COLORS.brass }} /></div>
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Segment mix</h3>
          {segmentMix.map((s) => (
            <div key={s.segment} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{s.segment}</span><span style={{ color: COLORS.inkSoft }}>{s.count} clients</span>
              </div>
              <div style={{ height: 6, background: '#EEF0EE' }}><div style={{ height: '100%', width: `${(s.count / maxSegmentCount) * 100}%`, background: COLORS.ink }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ width: 38, height: 20, borderRadius: 10, border: `1px solid ${COLORS.line}`, background: checked ? COLORS.brass : '#E4E6E1', position: 'relative', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 1, left: checked ? 19 : 1, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  return (
    <div>
      <PageHeader title="Settings" subtitle="Your profile and notification preferences" />
      <div style={{ border: `1px solid ${COLORS.line}`, marginBottom: 28, maxWidth: 480 }}>
        {[['Name', 'Aisha Rahman'], ['Role', 'Relationship Manager'], ['Email', 'aisha.rahman@company.in']].map(([label, val], i) => (
          <div key={label} style={{ padding: '14px 18px', borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14 }}>{val}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Notifications</h3>
      <div style={{ border: `1px solid ${COLORS.line}`, maxWidth: 480 }}>
        {[
          ['Email notifications', 'Get notified by email about client policy renewals', emailNotif, setEmailNotif],
          ['SMS alerts', 'Receive SMS for urgent claim updates', smsAlerts, setSmsAlerts],
          ['Weekly digest', 'A weekly summary of your portfolio activity', weeklyDigest, setWeeklyDigest],
        ].map(([label, desc, val, setter], i) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{desc}</div>
            </div>
            <Switch checked={val} onChange={setter} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [customers, setCustomers] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const [customersRes, policiesRes, claimsRes, casesRes] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('policies').select('*'),
        supabase.from('claims').select('*'),
        supabase.from('cases').select('*').order('opened', { ascending: false }),
      ]);
      if (cancelled) return;

      const firstError = customersRes.error || policiesRes.error || claimsRes.error || casesRes.error;
      if (firstError) {
        setLoadError(firstError.message);
        setLoading(false);
        return;
      }

      const combined = customersRes.data.map((c) => ({
        id: c.id,
        name: c.name,
        age: c.age,
        gender: c.gender,
        city: c.city,
        segment: c.segment,
        customerSince: c.customer_since,
        lastContact: c.last_contact,
        phone: c.phone,
        email: c.email,
        policies: policiesRes.data
          .filter((p) => p.customer_id === c.id)
          .map((p) => ({
            product: p.product,
            status: p.status,
            policyNumber: p.policy_number,
            sumInsured: Number(p.sum_insured),
            premium: Number(p.premium),
            startDate: p.start_date,
            renewalDate: p.renewal_date,
          })),
        claims: claimsRes.data
          .filter((cl) => cl.customer_id === c.id)
          .map((cl) => ({
            id: cl.id,
            date: cl.claim_date,
            product: cl.product,
            type: cl.type,
            amount: Number(cl.amount),
            status: cl.status,
          })),
      }));

      setCustomers(combined);
      setCases(
        casesRes.data.map((cs) => ({
          id: cs.id,
          customer: cs.customer_name,
          subject: cs.subject,
          category: cs.category,
          channel: cs.channel,
          status: cs.status,
          opened: cs.opened,
        }))
      );
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveCustomer(id, patch) {
    const { error } = await supabase
      .from('customers')
      .update({
        name: patch.name,
        age: Number(patch.age) || null,
        gender: patch.gender,
        city: patch.city,
        phone: patch.phone,
        email: patch.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, age: Number(patch.age) || c.age } : c)));
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.paper }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .c360-scroll::-webkit-scrollbar { width: 6px; }
        .c360-scroll::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 3px; }
        .c360-row:hover { background: #F7F8F5; }
        .c360-chip:hover { color: ${COLORS.ink} !important; }
        .c360-prow:hover { background: #FAFAF8; }
        .c360-link { background: none; border: none; padding: 0; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: ${COLORS.brass}; font-weight: 600; }
        .c360-link:hover { text-decoration: underline; }
        input:focus-visible, button:focus-visible { outline: 2px solid ${COLORS.brass}; outline-offset: 2px; }
        @media (max-width: 800px) {
          .c360-shell { flex-direction: column; }
          .c360-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid ${COLORS.line}; }
        }
      `}</style>
      <div className="c360-shell" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'IBM Plex Sans', sans-serif", color: COLORS.ink }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <div className="c360-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          {loading && <div style={{ fontSize: 14, color: COLORS.inkSoft }}>Loading client data…</div>}
          {!loading && loadError && (
            <div style={{ fontSize: 14, color: COLORS.brick, maxWidth: 480 }}>
              Couldn't load data from Supabase: {loadError}. Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.
            </div>
          )}
          {!loading && !loadError && (
            <>
              {activePage === 'home' && <HomePage customers={customers} cases={cases} setActivePage={setActivePage} />}
              {activePage === 'customers' && <CustomersPage customers={customers} onSaveCustomer={saveCustomer} />}
              {activePage === 'cases' && <CasesPage cases={cases} />}
              {activePage === 'report' && <ReportPage customers={customers} />}
              {activePage === 'settings' && <SettingsPage />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
