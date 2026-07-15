'use client';

import { useState } from 'react';
import {
  LuLayoutDashboard, LuUsers, LuCreditCard, LuSettings, LuScroll,
  LuChevronLeft, LuChevronRight, LuRotateCw, LuLock,
  LuSearch, LuEllipsis, LuTrendingUp, LuBell, LuZap,
} from 'react-icons/lu';
import s from './DemoCard.module.css';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
  { id: 'members',   label: 'Members',   Icon: LuUsers },
  { id: 'billing',   label: 'Billing',   Icon: LuCreditCard },
  { id: 'settings',  label: 'Settings',  Icon: LuSettings },
  { id: 'audit',     label: 'Audit Log', Icon: LuScroll },
];

const DATA = [28, 45, 38, 62, 48, 78, 55, 71, 44, 95, 68, 52];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Chart SVG dimensions
const CW = 480; // total width
const CH = 72;  // total height
const PAD = { top: 8, bottom: 20, left: 4, right: 4 };
const innerH = CH - PAD.top - PAD.bottom;
const innerW = CW - PAD.left - PAD.right;
const maxVal = Math.max(...DATA);

// Map data value → SVG coordinates
const toX = (i: number) => PAD.left + (i / (DATA.length - 1)) * innerW;
const toY = (v: number) => PAD.top + (1 - v / maxVal) * innerH;

// Build smooth bezier line path (cubic, mid-point control handles)
function linePath() {
  const pts = DATA.map((v, i) => ({ x: toX(i), y: toY(v) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cpx = (pts[i].x + pts[i + 1].x) / 2;
    d += ` C ${cpx} ${pts[i].y}, ${cpx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}

// Same path closed to the bottom edge to create the fill area
function areaPath() {
  const pts = DATA.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const bottomY = PAD.top + innerH;
  let d = `M ${pts[0].x} ${bottomY} L ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cpx = (pts[i].x + pts[i + 1].x) / 2;
    d += ` C ${cpx} ${pts[i].y}, ${cpx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${bottomY} Z`;
  return d;
}

const PEAK_IDX = DATA.indexOf(maxVal); // October (index 9)

const MEMBERS = [
  { name: 'Alice Smith',   email: 'alice@acme.co',   role: 'Owner',  roleKey: 'owner',  color: '#6366f1' },
  { name: 'Bob Jones',     email: 'bob@acme.co',     role: 'Admin',  roleKey: 'admin',  color: '#22c55e' },
  { name: 'Charlie Davis', email: 'charlie@acme.co', role: 'Member', roleKey: 'member', color: '#f59e0b' },
];

const LOGS = [
  { time: '2m ago',    text: 'Alice Smith updated settings',       green: false },
  { time: '1h ago',    text: 'Bob invited charlie@acme.co',        green: false },
  { time: 'Yesterday', text: 'Upgraded to Pro Plan',               green: true },
];

function MemberAvatar({ name, color }: { name: string; color: string }) {
  return (
    <div className={s.memberAvatar} style={{ background: color }}>
      {name[0]}
    </div>
  );
}

export function DemoCard() {
  const [tab, setTab] = useState('dashboard');
  const urlPath = tab === 'dashboard' ? '' : tab;

  return (
    <div className={s.card}>

      {/* ── Browser chrome ── */}
      <div className={s.chrome}>
        <div className={s.trafficLights}>
          <span className={s.tlRed} />
          <span className={s.tlAmber} />
          <span className={s.tlGreen} />
        </div>
        <div className={s.navBtns}>
          <LuChevronLeft size={14} />
          <LuChevronRight size={14} style={{ opacity: 0.35 }} />
          <LuRotateCw size={12} />
        </div>
        <div className={s.urlBar}>
          <LuLock size={11} className={s.lockIcon} />
          <span>app.saas.com/acme/{urlPath}</span>
        </div>
        <div className={s.chromeRight}>
          <div className={s.chromeAvatar} />
        </div>
      </div>

      {/* ── App shell ── */}
      <div className={s.shell}>

        {/* Sidebar */}
        <aside className={s.sidebar}>
          {/* Org logo + name */}
          <div className={s.orgRow}>
            <div className={s.orgLogo} />
            <div>
              <div className={s.orgName}>Acme Corp</div>
              <div className={s.orgPlan}>Pro Plan</div>
            </div>
          </div>

          {/* Nav */}
          <nav className={s.nav}>
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`${s.navItem} ${tab === id ? s.navActive : ''}`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* User */}
          <div className={s.userRow}>
            <MemberAvatar name="Alice Smith" color="#6366f1" />
            <div className={s.userMeta}>
              <div className={s.userName}>Alice Smith</div>
              <div className={s.userRole}>Owner</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className={s.main}>

          {/* Topbar */}
          <div className={s.topbar}>
            <div className={s.topbarTitle}>
              {NAV.find(n => n.id === tab)?.label}
            </div>
            <div className={s.topbarRight}>
              <div className={s.searchBox}>
                <LuSearch size={11} />
                <span>Search…</span>
              </div>
              <div className={s.notifBtn}><LuBell size={13} /></div>
            </div>
          </div>

          {/* ── Dashboard view ── */}
          {tab === 'dashboard' && (
            <div className={s.view} key="dashboard">
              {/* Stat cards */}
              <div className={s.statRow}>
                {[
                  { label: 'Revenue',  value: '$12.4k', delta: '+18%', color: '#6366f1' },
                  { label: 'Users',    value: '1,284',  delta: '+4%',  color: '#22c55e' },
                  { label: 'Orgs',     value: '89',     delta: '+12',  color: '#f59e0b' },
                ].map(({ label, value, delta, color }) => (
                  <div key={label} className={s.statCard}>
                    <div className={s.statIcon} style={{ background: color + '18', color }}><LuTrendingUp size={12} /></div>
                    <div className={s.statContent}>
                      <div className={s.statLabel}>{label}</div>
                      <div className={s.statVal}>{value}</div>
                    </div>
                    <div className={s.statDelta} style={{ color }}>{delta}</div>
                  </div>
                ))}
              </div>

              {/* SVG Area Chart */}
              <div className={s.chartCard}>
                <div className={s.chartHead}>
                  <span className={s.chartTitle}>Revenue — Last 12 months</span>
                  <span className={s.badge}><LuZap size={9} /> Live</span>
                </div>

                <svg
                  viewBox={`0 0 ${CW} ${CH}`}
                  className={s.chartSvg}
                  aria-label="Revenue chart"
                >
                  <defs>
                    {/* Gradient for the area fill */}
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                    {/* Glow filter on the line */}
                    <filter id="glow" x="-10%" y="-40%" width="120%" height="180%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  {/* Subtle horizontal grid lines at 25%, 50%, 75% */}
                  {[0.25, 0.5, 0.75].map(t => (
                    <line
                      key={t}
                      x1={PAD.left} y1={PAD.top + (1 - t) * innerH}
                      x2={CW - PAD.right} y2={PAD.top + (1 - t) * innerH}
                      stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="4 4"
                    />
                  ))}

                  {/* Gradient fill area */}
                  <path d={areaPath()} fill="url(#areaGrad)" />

                  {/* The smooth line */}
                  <path
                    d={linePath()}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />

                  {/* Peak dot with halo ring */}
                  <circle
                    cx={toX(PEAK_IDX)} cy={toY(maxVal)}
                    r="5" fill="#6366f1"
                  />
                  <circle
                    cx={toX(PEAK_IDX)} cy={toY(maxVal)}
                    r="8.5" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.3"
                  />

                  {/* Peak tooltip label */}
                  <rect
                    x={toX(PEAK_IDX) - 22} y={toY(maxVal) - 19}
                    width="44" height="14" rx="4"
                    fill="#6366f1"
                  />
                  <text
                    x={toX(PEAK_IDX)} y={toY(maxVal) - 9}
                    textAnchor="middle" fontSize="7.5" fontWeight="700"
                    fill="#fff" fontFamily="ui-sans-serif, system-ui, sans-serif"
                  >
                    $9,500
                  </text>

                  {/* Month labels along the bottom */}
                  {MONTHS.map((m, i) => (
                    <text
                      key={m}
                      x={toX(i)} y={CH - 4}
                      textAnchor="middle" fontSize="7" fill="#c8cdd6"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      fontWeight="500"
                    >
                      {m}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Bottom split */}
              <div className={s.bottomGrid}>
                {/* Recent members */}
                <div className={s.miniCard}>
                  <div className={s.miniHead}>
                    <span className={s.miniTitle}>Team</span>
                    <button className={s.miniLink} onClick={() => setTab('members')}>View all →</button>
                  </div>
                  {MEMBERS.map(({ name, email, color }) => (
                    <div key={email} className={s.miniRow}>
                      <MemberAvatar name={name} color={color} />
                      <div className={s.miniInfo}>
                        <div className={s.miniName}>{name}</div>
                        <div className={s.miniSub}>{email}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activity */}
                <div className={s.miniCard}>
                  <div className={s.miniHead}>
                    <span className={s.miniTitle}>Activity</span>
                    <button className={s.miniLink} onClick={() => setTab('audit')}>View all →</button>
                  </div>
                  {LOGS.map(({ time, text, green }, i) => (
                    <div key={i} className={s.logRow}>
                      <div className={`${s.logDot} ${green ? s.logDotGreen : ''}`} />
                      <div className={s.logText}>{text}</div>
                      <div className={s.logTime}>{time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Members view ── */}
          {tab === 'members' && (
            <div className={s.view} key="members">
              <div className={s.viewActions}>
                <div className={s.searchBox} style={{ flex: 1, maxWidth: 240 }}>
                  <LuSearch size={11} /><span>Search members…</span>
                </div>
                <button className={s.btnPrimary}>+ Invite</button>
              </div>
              <div className={s.table}>
                <div className={s.tableHead}>
                  <span>Name</span><span>Role</span><span></span>
                </div>
                {MEMBERS.map(({ name, email, role, roleKey, color }) => (
                  <div key={email} className={s.tableRow}>
                    <div className={s.memberCell}>
                      <MemberAvatar name={name} color={color} />
                      <div>
                        <div className={s.memberName}>{name}</div>
                        <div className={s.memberEmail}>{email}</div>
                      </div>
                    </div>
                    <span className={`${s.rolePill} ${s[`role_${roleKey}`]}`}>{role}</span>
                    <LuEllipsis size={13} className={s.moreIcon} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Billing view ── */}
          {tab === 'billing' && (
            <div className={s.view} key="billing">
              <div className={s.planCard}>
                <div className={s.planLeft}>
                  <div className={s.planBadge}>Pro Plan</div>
                  <div className={s.planPrice}>$99<span>/mo</span></div>
                  <p className={s.planNote}>Next charge: <strong>Aug 1, 2026</strong></p>
                </div>
                <div className={s.planRight}>
                  <button className={s.btnPrimary}>Manage</button>
                  <button className={s.btnSecondary}>Invoices</button>
                </div>
              </div>
              <div className={s.usageCard}>
                <div className={s.usageRow}>
                  <span className={s.usageLabel}>Seats used</span>
                  <span className={s.usageCount}>3 / 8</span>
                </div>
                <div className={s.usageTrack}>
                  <div className={s.usageFill} style={{ width: '37.5%' }} />
                </div>
              </div>
              <div className={s.invoiceCard}>
                <div className={s.miniHead}><span className={s.miniTitle}>Recent Invoices</span></div>
                {['Jul 2026', 'Jun 2026', 'May 2026'].map(m => (
                  <div key={m} className={s.invoiceRow}>
                    <span className={s.invoiceMonth}>{m}</span>
                    <span className={s.invoiceAmt}>$99.00</span>
                    <span className={s.invoicePaid}>Paid</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Settings view ── */}
          {tab === 'settings' && (
            <div className={s.view} key="settings">
              <div className={s.settingsCard}>
                <div className={s.settingsTitle}>Organization</div>
                <div className={s.field}>
                  <label className={s.fieldLabel}>Name</label>
                  <div className={s.fieldInput}>Acme Corp</div>
                </div>
                <div className={s.field}>
                <label className={s.fieldLabel}>Workspace URL</label>
                <div className={s.fieldInputGroup}>
                  <span className={s.fieldPrefix}>app.saas.com/</span>
                  <span className={s.fieldValue}>acme</span>
                </div>
              </div>
              <div className={s.settingsActions}>
                <button className={s.btnPrimary}>Save Changes</button>
              </div>
              </div>
            </div>
          )}

          {/* ── Audit Log view ── */}
          {tab === 'audit' && (
            <div className={s.view} key="audit">
              <div className={s.viewActions}>
                <div className={s.searchBox} style={{ flex: 1, maxWidth: 240 }}>
                  <LuSearch size={11} /><span>Search logs…</span>
                </div>
              </div>
              <div className={s.auditCard}>
                {LOGS.concat(LOGS).map(({ time, text, green }, i) => (
                  <div key={i} className={s.auditRow}>
                    <div className={`${s.auditDot} ${green ? s.auditDotGreen : ''}`} />
                    <div className={s.auditText}>{text}</div>
                    <div className={s.auditTime}>{time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
