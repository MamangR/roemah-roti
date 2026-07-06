'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { getDashboardStats } from './actions';

export default function AdminDashboardPage() {
  const router = useRouter();

  const DATA = {
    today: {
      labels: ['7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM'],
      revenue: [180000,320000,410000,380000,520000,610000,540000,430000,390000,460000,410000,350000,290000,240000],
      visits: [8,14,18,16,22,26,24,19,17,20,18,15,12,9],
      newMembers: [0,1,0,1,0,1,1,0,0,1,0,0,0,1],
      memberTxn: [3,5,6,5,7,8,7,6,5,6,5,4,3,2],
      nonMemberTxn: [2,3,3,3,4,4,4,3,3,3,3,2,2,1],
      rewardsRedeemed: 9,
      totalMembers: 1284,
      activeMembers: 512,
      products: [
        { name: 'Original Saltbread', qty: 42, revenue: 840000, contribution: 27.4 },
        { name: 'Choco Saltbread', qty: 35, revenue: 700000, contribution: 22.8 },
        { name: 'Cheese Saltbread', qty: 28, revenue: 560000, contribution: 18.3 },
        { name: 'Sourdough Loaf', qty: 18, revenue: 396000, contribution: 12.9 },
        { name: 'Butter Croissant', qty: 24, revenue: 384000, contribution: 12.5 },
        { name: 'Cinnamon Roll', qty: 14, revenue: 182000, contribution: 5.9 }
      ],
      growth: { revenue: 8.4, transactions: 5.1, aov: 3.1, itemsSold: 6.7, newMembers: 25.0, totalVisits: 11.2, rewardsRedeemed: -4.3, totalMembers: 1.8, activeMembers: 3.4, memberTransactions: 9.0, nonMemberTransactions: -2.2, memberRate: 2.6 }
    },
    custom: {
      labels: ['30 Jun','1 Jul','2 Jul','3 Jul','4 Jul','5 Jul','6 Jul'],
      revenue: [4200000,4650000,4100000,4900000,5300000,4550000,3700000],
      visits: [118,132,110,140,155,128,119],
      newMembers: [4,6,3,7,8,4,2],
      memberTxn: [45,52,42,55,60,50,44],
      nonMemberTxn: [24,28,22,29,31,27,23],
      rewardsRedeemed: 58,
      totalMembers: 1284,
      activeMembers: 588,
      products: [
        { name: 'Original Saltbread', qty: 294, revenue: 5880000, contribution: 27.1 },
        { name: 'Choco Saltbread', qty: 245, revenue: 4900000, contribution: 22.6 },
        { name: 'Cheese Saltbread', qty: 196, revenue: 3920000, contribution: 18.1 },
        { name: 'Sourdough Loaf', qty: 126, revenue: 2772000, contribution: 12.8 },
        { name: 'Butter Croissant', qty: 168, revenue: 2688000, contribution: 12.4 },
        { name: 'Cinnamon Roll', qty: 98, revenue: 1274000, contribution: 5.9 }
      ],
      growth: { revenue: 12.6, transactions: 9.8, aov: 2.5, itemsSold: 10.1, newMembers: 14.7, totalVisits: 7.9, rewardsRedeemed: -1.5, totalMembers: 6.2, activeMembers: 8.0, memberTransactions: 11.3, nonMemberTransactions: 4.0, memberRate: 1.1 }
    }
  };

  const [filter, setFilter] = useState<'today' | 'allTime' | 'custom'>('today');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(6); // July
  const [selStart, setSelStart] = useState('2026-06-30');
  const [selEnd, setSelEnd] = useState('2026-07-06');
  const [appliedStart, setAppliedStart] = useState('2026-06-30');
  const [appliedEnd, setAppliedEnd] = useState('2026-07-06');
  const [hover, setHover] = useState<{key: string, i: number} | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [liveData, setLiveData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      let start = appliedStart;
      let end = appliedEnd;
      if (filter === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        start = today;
        end = today;
      } else if (filter === 'allTime') {
        start = '2020-01-01';
        end = new Date().toISOString().slice(0, 10);
      }
      try {
        const data = await getDashboardStats(start, end);
        setLiveData(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [appliedStart, appliedEnd, filter]);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const fmtIDR = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
  const fmtNum = (n: number) => Math.round(n).toLocaleString('id-ID');
  const fmtPct = (n: number) => n.toFixed(1) + '%';
  const fmtCompact = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'jt';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'rb';
    return Math.round(n).toString();
  };
  const pad = (n: number) => n < 10 ? '0' + n : '' + n;
  const iso = (y: number, m: number, d: number) => y + '-' + pad(m + 1) + '-' + pad(d);

  const growthParts = (g: number) => {
    const up = g >= 0;
    const upColor = '#A67C52';
    return {
      growthText: (up ? '+' : '') + g.toFixed(1) + '%',
      growthColor: up ? upColor : '#7A6A5F',
      arrowStyle: up
        ? { width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `6px solid ${upColor}` }
        : { width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #7A6A5F' }
    };
  };

  const buildLine = (values: number[]) => {
    const padL = 10, padR = 10, padT = 24, padB = 40, w = 1000, h = 280;
    const max = Math.max(...values) * 1.15 || 1;
    const innerW = w - padL - padR, innerH = h - padT - padB;
    const n = values.length;
    const points = values.map((v, i) => ({
      x: padL + (n === 1 ? innerW / 2 : i * (innerW / (n - 1))),
      y: padT + innerH - (v / max) * innerH,
      v, i
    }));
    const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
    const baseline = padT + innerH;
    const areaPath = path + ` L ${points[n - 1].x.toFixed(1)} ${baseline.toFixed(1)} L ${points[0].x.toFixed(1)} ${baseline.toFixed(1)} Z`;
    return { points, path, areaPath, baseline, max, padT, innerH };
  };

  const buildBars = (values: number[]) => {
    const padL = 10, padR = 10, padT = 24, padB = 40, w = 1000, h = 280, gap = 0.4;
    const max = Math.max(...values) * 1.15 || 1;
    const innerW = w - padL - padR, innerH = h - padT - padB;
    const n = values.length;
    const slot = innerW / n;
    const barW = slot * (1 - gap);
    const bars = values.map((v, i) => {
      const bh = (v / max) * innerH;
      return { x: padL + i * slot + (slot - barW) / 2, y: padT + innerH - bh, w: barW, h: bh, cx: padL + i * slot + slot / 2, v, i };
    });
    return { bars, baseline: padT + innerH, max, padT, innerH };
  };

  const buildStacked = (memberArr: number[], nonArr: number[]) => {
    const padL = 10, padR = 10, padT = 24, padB = 40, w = 1000, h = 280, gap = 0.4;
    const totals = memberArr.map((v, i) => v + nonArr[i]);
    const max = Math.max(...totals) * 1.15 || 1;
    const innerW = w - padL - padR, innerH = h - padT - padB;
    const n = memberArr.length;
    const slot = innerW / n;
    const barW = slot * (1 - gap);
    const bars = memberArr.map((mv, i) => {
      const nv = nonArr[i];
      const mh = (mv / max) * innerH;
      const nh = (nv / max) * innerH;
      const x = padL + i * slot + (slot - barW) / 2;
      const nonY = padT + innerH - nh;
      const memY = nonY - mh;
      return { x, w: barW, cx: x + barW / 2, memY, memH: mh, nonY, nonH: nh, mv, nv, i };
    });
    return { bars, baseline: padT + innerH };
  };

  const gridLines = (padT: number, innerH: number) => [0, 1, 2, 3].map(i => padT + (innerH / 3) * i);
  const colBounds = (xs: number[], wTotal: number) => {
    const n = xs.length;
    return xs.map((x, i) => {
      const left = i === 0 ? 0 : (xs[i - 1] + x) / 2;
      const right = i === n - 1 ? wTotal : (x + xs[i + 1]) / 2;
      return { left, width: right - left };
    });
  };

  // 'allTime' reuses the 'custom' data shape for chart visuals; live metrics come from DB
  const d = filter === 'today' ? DATA.today : DATA.custom;
  const g = d.growth;

  const revenueSum = liveData ? liveData.revenueSum : 0;
  const visitsSum = liveData ? liveData.totalVisits : 0;
  const newMembersSum = liveData ? liveData.newMembersSum : 0;
  const memberTxnSum = liveData ? liveData.memberTxnSum : 0;
  const nonMemberTxnSum = liveData ? liveData.nonMemberTxnSum : 0;
  const transactions = liveData ? liveData.transactions : 0;
  const aov = liveData ? liveData.aov : 0;
  const itemsSold = Math.round(transactions * 3.4);
  const memberRate = transactions > 0 ? (memberTxnSum / transactions) * 100 : 0;

  const mk = (label: string, value: string, gkey: keyof typeof g) => {
    const gp = growthParts(g[gkey]);
    return { label, value, ...gp };
  };

  const businessMetrics = [
    mk('Revenue', fmtIDR(revenueSum), 'revenue'),
    mk('Total transactions', fmtNum(transactions), 'transactions'),
    mk('Average order value', fmtIDR(aov), 'aov'),
    mk('Items sold', fmtNum(itemsSold), 'itemsSold'),
    mk('New members', fmtNum(newMembersSum), 'newMembers'),
    mk('Total visits', fmtNum(visitsSum), 'totalVisits'),
    mk('Rewards redeemed', fmtNum(liveData ? liveData.rewardsRedeemed : 0), 'rewardsRedeemed')
  ];

  const memberMetrics = [
    mk('Total members', fmtNum(liveData ? liveData.totalMembers : 0), 'totalMembers'),
    mk('Active members (30-day)', fmtNum(liveData ? liveData.activeMembers : 0), 'activeMembers'),
    mk('Member transactions', fmtNum(memberTxnSum), 'memberTransactions'),
    mk('Non-member transactions', fmtNum(nonMemberTxnSum), 'nonMemberTransactions'),
    mk('Member rate', fmtPct(memberRate), 'memberRate')
  ];

  const products = d.products.map(p => ({
    name: p.name,
    qtyText: fmtNum(p.qty),
    revenueText: fmtIDR(p.revenue),
    contribution: p.contribution,
    contributionText: p.contribution.toFixed(1) + '%'
  }));

  const rev = buildLine(d.revenue);
  const vis = buildBars(d.visits);
  const nm = buildLine(d.newMembers);
  const stk = buildStacked(d.memberTxn, d.nonMemberTxn);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ blank: true, filled: false, day: null, cellStyle: {}, onClick: () => {} });
  const baseCellStyle: React.CSSProperties = { textAlign: 'center', padding: '7px 0', fontSize: '12px', fontWeight: 500, borderRadius: '8px', cursor: 'pointer', fontVariantNumeric: 'tabular-nums', color: '#3B2A22' };
  const endpointCellStyle: React.CSSProperties = { textAlign: 'center', padding: '7px 0', fontSize: '12px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', fontVariantNumeric: 'tabular-nums', background: '#A67C52', color: '#fff' };
  const inRangeCellStyle: React.CSSProperties = { textAlign: 'center', padding: '7px 0', fontSize: '12px', fontWeight: 500, borderRadius: '8px', cursor: 'pointer', fontVariantNumeric: 'tabular-nums', background: 'rgba(122, 150, 116, 0.18)', color: '#3B2A22' };

  for (let day = 1; day <= daysInMonth; day++) {
    const ds = iso(calYear, calMonth, day);
    const inRange = selStart && selEnd && ds >= selStart && ds <= selEnd;
    const isEndpoint = ds === selStart || ds === selEnd;
    const cellStyle = isEndpoint ? endpointCellStyle : inRange ? inRangeCellStyle : baseCellStyle;
    cells.push({ blank: false, filled: true, day, cellStyle, onClick: () => {
      if (!selStart || (selStart && selEnd)) { setSelStart(ds); setSelEnd(''); }
      else if (ds < selStart) { setSelEnd(selStart); setSelStart(ds); }
      else { setSelEnd(ds); }
    } });
  }


  const fmtShort = (isod: string) => {
    const [y, m, dd] = isod.split('-').map(Number);
    return parseInt(String(dd), 10) + ' ' + monthNames[m - 1].slice(0, 3);
  };
  const rangeLabel = appliedStart === appliedEnd
    ? fmtShort(appliedStart) + ', ' + appliedStart.split('-')[0]
    : fmtShort(appliedStart) + ' – ' + fmtShort(appliedEnd) + ', ' + appliedEnd.split('-')[0];

  const navItems = [
    { label: 'Overview', path: '/admin', active: true },
    { label: 'Members', path: '/admin/members', active: false },
    { label: 'Rewards', path: '/admin/rewards', active: false },
    { label: 'Referrals', path: '/admin/referrals', active: false },
    { label: 'Updates', path: '/admin/updates', active: false },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F4EE', paddingBottom: '64px', fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile nav drawer overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,19,15,0.55)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '280px', background: '#3B2A22', padding: '28px 20px', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 40px rgba(0,0,0,0.4)' }}
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#E9C9A6', letterSpacing: '-.02em' }}>RR</span>
                </div>
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '.22em', color: 'rgba(248,244,238,.55)', textTransform: 'uppercase' }}>Roemah Roti</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(248,244,238,.92)' }}>Owner Dashboard</div>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                style={{ background: 'rgba(248,244,238,.08)', border: 'none', color: 'rgba(248,244,238,.7)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px' }}
              >✕</button>
            </div>
            {/* Nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.map(item => (
                <div
                  key={item.path}
                  onClick={() => { router.push(item.path); setMobileNavOpen(false); }}
                  style={{ padding: '13px 14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', background: item.active ? 'rgba(166,124,82,.9)' : 'transparent', color: item.active ? '#2A1E18' : 'rgba(248,244,238,.72)', transition: 'background .15s' }}
                >
                  {item.label}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: '11px', color: 'rgba(248,244,238,.35)', lineHeight: 1.5 }}>Staff tool · internal use</div>
          </div>
        </div>
      )}

      {/* Sticky filter bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#FCFBF8', borderBottom: '1px solid #EAE1D5', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between" style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px', gap: '16px' }}>

          {/* Top Row for Mobile (Title + Burger) / Left Side for Desktop */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flex: '1 1 auto', minWidth: 0, width: '100%' }}>
            {/* Logo + title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: '#A08A7B' }}>Roemah Roti · Owner dashboard</div>
              <div style={{ fontSize: '22px', letterSpacing: '-0.03em', fontWeight: 600, color: '#3B2A22', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dashboard overview</div>
            </div>

            {/* Burger button — shown on mobile only */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex md:hidden"
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(59,42,34,.1)', borderRadius: '8px', width: '36px', height: '36px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', flex: 'none' }}
            >
              <span style={{ width: '14px', height: '1.6px', background: '#3B2A22', borderRadius: '1px', display: 'block' }} />
              <span style={{ width: '14px', height: '1.6px', background: '#3B2A22', borderRadius: '1px', display: 'block' }} />
              <span style={{ width: '14px', height: '1.6px', background: '#3B2A22', borderRadius: '1px', display: 'block' }} />
            </button>
          </div>

          {/* Right Side for Desktop / Bottom Row for Mobile */}
          <div className="flex flex-col md:flex-row items-start md:items-center" style={{ gap: '16px' }}>
            {/* Desktop nav links — hidden on mobile */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="hidden md:flex">
              {navItems.map(item => (
                <span
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  style={{ fontWeight: item.active ? 600 : 500, color: item.active ? '#A67C52' : '#7A6A5F', cursor: 'pointer', fontSize: '14px' }}
                >{item.label}</span>
              ))}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap md:flex-nowrap items-start md:items-center" style={{ gap: '10px', position: 'relative' }}>
              {/* Date filter pill */}
              <div style={{ display: 'flex', background: '#F1EBE1', borderRadius: '14px', padding: '4px' }}>
                <div onClick={() => { setFilter('today'); setCalendarOpen(false); }} style={{ padding: '7px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: filter === 'today' ? '#fff' : 'transparent', borderRadius: '11px', color: filter === 'today' ? '#3B2A22' : '#A08A7B', boxShadow: filter === 'today' ? '0 4px 12px -4px rgba(59,42,34,.25)' : 'none', whiteSpace: 'nowrap' }}>Today</div>
                <div onClick={() => { setFilter('allTime'); setCalendarOpen(false); }} style={{ padding: '7px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: filter === 'allTime' ? '#fff' : 'transparent', borderRadius: '11px', color: filter === 'allTime' ? '#3B2A22' : '#A08A7B', boxShadow: filter === 'allTime' ? '0 4px 12px -4px rgba(59,42,34,.25)' : 'none', whiteSpace: 'nowrap' }}>All Time</div>
                <div onClick={() => { setFilter('custom'); setCalendarOpen(true); }} style={{ padding: '7px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: filter === 'custom' ? '#fff' : 'transparent', borderRadius: '11px', color: filter === 'custom' ? '#3B2A22' : '#A08A7B', boxShadow: filter === 'custom' ? '0 4px 12px -4px rgba(59,42,34,.25)' : 'none', whiteSpace: 'nowrap' }}>Custom</div>
              </div>

              {filter === 'custom' && (
                <div onClick={() => setCalendarOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #E6DDD0', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)', whiteSpace: 'nowrap' }}>
                  <div style={{ width: '14px', height: '14px', border: '1.5px solid #A67C52', borderRadius: '3px', position: 'relative', flex: 'none' }}>
                    <div style={{ position: 'absolute', left: '2px', right: '2px', top: '-4px', height: '4px', borderLeft: '1.5px solid #A67C52', borderRight: '1.5px solid #A67C52' }}></div>
                    <div style={{ position: 'absolute', left: '1px', right: '1px', top: '2px', height: '1px', background: '#A67C52' }}></div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#3B2A22', fontVariantNumeric: 'tabular-nums' }}>{rangeLabel}</span>
                </div>
              )}

              {calendarOpen && (
                <div style={{ position: 'absolute', top: '52px', right: 0, zIndex: 60, background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 18px 40px -18px rgba(59,42,34,.55)', padding: '20px', width: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div onClick={() => {
                      let m = calMonth - 1, y = calYear;
                      if (m < 0) { m = 11; y -= 1; }
                      setCalMonth(m); setCalYear(y);
                    }} style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F1EBE1' }}>
                      <div style={{ width: '7px', height: '7px', borderLeft: '1.5px solid #3B2A22', borderBottom: '1.5px solid #3B2A22', transform: 'rotate(45deg)', marginLeft: '2px' }}></div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#3B2A22' }}>{monthNames[calMonth]} {calYear}</div>
                    <div onClick={() => {
                      let m = calMonth + 1, y = calYear;
                      if (m > 11) { m = 0; y += 1; }
                      setCalMonth(m); setCalYear(y);
                    }} style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F1EBE1' }}>
                      <div style={{ width: '7px', height: '7px', borderRight: '1.5px solid #3B2A22', borderTop: '1.5px solid #3B2A22', transform: 'rotate(45deg)', marginRight: '2px' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '6px' }}>
                    {['S','M','T','W','T','F','S'].map((wd, i) => <div key={i} style={{ fontSize: '10px', fontWeight: 600, color: '#A08A7B', textAlign: 'center', padding: '4px 0' }}>{wd}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                    {cells.map((cell, i) => (
                      <div key={i}>
                        {cell.filled && <div onClick={cell.onClick} style={cell.cellStyle}>{cell.day}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <div onClick={() => { setCalendarOpen(false); setSelStart(appliedStart); setSelEnd(appliedEnd); }} style={{ flex: 1, textAlign: 'center', padding: '10px 0', border: '1px solid #E0D5C6', borderRadius: '14px', fontSize: '13px', fontWeight: 600, color: '#3B2A22', cursor: 'pointer' }}>Cancel</div>
                    <div onClick={() => { setCalendarOpen(false); setAppliedStart(selStart); setAppliedEnd(selEnd || selStart); }} style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: '#A67C52', borderRadius: '14px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 14px 26px -14px rgba(166,124,82,.9)' }}>Apply</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 0' }}>
        
        {/* BUSINESS PERFORMANCE */}
        <section style={{ marginBottom: '44px' }}>
          <div style={{ fontSize: '20px', letterSpacing: '-0.02em', fontWeight: 600, color: '#3B2A22', marginBottom: '16px' }}>Business performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
            {businessMetrics.map((m, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: '#A08A7B' }}>{m.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em', color: '#3B2A22', marginTop: '10px', fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                  <div style={m.arrowStyle as any}></div>
                  <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: m.growthColor }}>{m.growthText}</span>
                  <span style={{ fontSize: '12px', color: '#A08A7B' }}>vs previous</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MEMBER PERFORMANCE */}
        <section style={{ marginBottom: '44px' }}>
          <div style={{ fontSize: '20px', letterSpacing: '-0.02em', fontWeight: 600, color: '#3B2A22', marginBottom: '16px' }}>Member performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {memberMetrics.map((m, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: '#A08A7B' }}>{m.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em', color: '#3B2A22', marginTop: '10px', fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                  <div style={m.arrowStyle as any}></div>
                  <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: m.growthColor }}>{m.growthText}</span>
                  <span style={{ fontSize: '12px', color: '#A08A7B' }}>vs previous</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#3B2A22' }}>Member vs non-member transactions</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#A67C52' }}></div><span style={{ fontSize: '12px', color: '#7A6A5F' }}>Member</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#F1EBE1', border: '1px solid #E6DDD0' }}></div><span style={{ fontSize: '12px', color: '#7A6A5F' }}>Non-member</span></div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 1000 280" preserveAspectRatio="none" style={{ width: '100%', height: '280px', display: 'block' }}>
                {gridLines(24, 280 - 24 - 40).map((gy, i) => <line key={`g${i}`} x1="10" x2="990" y1={gy} y2={gy} style={{ stroke: '#EAE1D5', strokeWidth: 1 }}></line>)}
                {stk.bars.map((b, i) => (
                  <g key={`b${i}`}>
                    <rect x={b.x} y={b.nonY} width={b.w} height={b.nonH} rx="3" style={{ fill: '#F1EBE1', stroke: '#E6DDD0', strokeWidth: 1, pointerEvents: 'none' }}></rect>
                    <rect x={b.x} y={b.memY} width={b.w} height={b.memH} rx="3" style={{ fill: '#A67C52', pointerEvents: 'none' }}></rect>
                  </g>
                ))}
                {colBounds(stk.bars.map(b => b.cx), 1000).map((c, i) => (
                  <rect key={`c${i}`} x={c.left} y={0} width={c.width} height={280} style={{ fill: 'transparent' }} onMouseEnter={() => setHover({ key: 'stacked', i })} onMouseLeave={() => setHover(null)}></rect>
                ))}
              </svg>
              <div style={{ display: 'flex', position: 'absolute', left: '10px', right: '10px', bottom: '8px', pointerEvents: 'none' }}>
                {d.labels.map((lbl, i) => <div key={i} className="chart-label" style={{ flex: 1, textAlign: 'center', color: '#A08A7B', fontVariantNumeric: 'tabular-nums' }}>{lbl}</div>)}
              </div>
              {hover?.key === 'stacked' && (
                <div style={{ position: 'absolute', left: `${(stk.bars[hover.i].cx / 10)}%`, top: `${Math.min(stk.bars[hover.i].memY, stk.bars[hover.i].nonY) - 12}px`, transform: 'translate(-50%,-100%)', background: '#3B2A22', color: 'rgba(248, 244, 238, 0.92)', padding: '9px 13px', borderRadius: '8px', fontSize: '11px', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 18px 40px -18px rgba(59, 42, 34, 0.55)', zIndex: 5 }}>
                  <div style={{ fontWeight: 600 }}>{d.labels[hover.i]}</div>
                  <div style={{ color: '#E9C9A6', marginTop: '3px' }}>Member: {fmtNum(stk.bars[hover.i].mv)}</div>
                  <div style={{ color: 'rgba(248, 244, 238, 0.72)', marginTop: '1px' }}>Non-member: {fmtNum(stk.bars[hover.i].nv)}</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRODUCT PERFORMANCE */}
        <section style={{ marginBottom: '44px' }}>
          <div style={{ fontSize: '20px', letterSpacing: '-0.02em', fontWeight: 600, color: '#3B2A22', marginBottom: '16px' }}>Product performance</div>
          <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1.2fr 1.4fr', padding: '14px 22px', borderBottom: '1px solid #EAE1D5' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: '#A08A7B' }}>Top selling products</div>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: '#A08A7B', textAlign: 'right' }}>Qty sold</div>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: '#A08A7B', textAlign: 'right' }}>Revenue</div>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase', color: '#A08A7B', textAlign: 'right', paddingLeft: '16px' }}>Contribution</div>
            </div>
            {products.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1.2fr 1.4fr', padding: '16px 22px', alignItems: 'center', borderBottom: '1px solid #EAE1D5' }}>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#3B2A22' }}>{p.name}</div>
                <div style={{ fontSize: '15px', color: '#4A3830', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.qtyText}</div>
                <div style={{ fontSize: '15px', color: '#4A3830', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.revenueText}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '16px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#F1EBE1', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', background: '#A67C52', width: p.contributionText }}></div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#3B2A22', fontVariantNumeric: 'tabular-nums', width: '38px', textAlign: 'right' }}>{p.contributionText}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* REVENUE TREND */}
        <section style={{ marginBottom: '44px' }}>
          <div style={{ fontSize: '20px', letterSpacing: '-0.02em', fontWeight: 600, color: '#3B2A22', marginBottom: '16px' }}>Revenue trend</div>
          <div style={{ background: '#FFFFFF', border: '1px solid #EFE8DE', borderRadius: '22px', padding: '22px', boxShadow: '0 10px 26px -20px rgba(59,42,34,.35)' }}>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 1000 280" preserveAspectRatio="none" style={{ width: '100%', height: '280px', display: 'block' }}>
                {gridLines(rev.padT, rev.innerH).map((gy, i) => <line key={`g${i}`} x1="10" x2="990" y1={gy} y2={gy} style={{ stroke: '#EAE1D5', strokeWidth: 1 }}></line>)}
                <path d={rev.areaPath} style={{ fill: '#A67C52', opacity: 0.12, stroke: 'none', pointerEvents: 'none' }}></path>
                <path d={rev.path} style={{ fill: 'none', stroke: '#A67C52', strokeWidth: 2.5, pointerEvents: 'none' }}></path>
                {rev.points.map((pt, i) => <circle key={`pt${i}`} cx={pt.x} cy={pt.y} r="3.5" style={{ fill: '#FFFFFF', stroke: '#A67C52', strokeWidth: 2, pointerEvents: 'none' }}></circle>)}
                {colBounds(rev.points.map(p => p.x), 1000).map((c, i) => (
                  <rect key={`c${i}`} x={c.left} y={0} width={c.width} height={280} style={{ fill: 'transparent' }} onMouseEnter={() => setHover({ key: 'rev', i })} onMouseLeave={() => setHover(null)}></rect>
                ))}
              </svg>
              <div style={{ display: 'flex', position: 'absolute', left: '10px', right: '10px', bottom: '8px', pointerEvents: 'none' }}>
                {d.labels.map((lbl, i) => <div key={i} className="chart-label" style={{ flex: 1, textAlign: 'center', color: '#A08A7B', fontVariantNumeric: 'tabular-nums' }}>{lbl}</div>)}
              </div>
              {hover?.key === 'rev' && (
                <div style={{ position: 'absolute', left: `${(rev.points[hover.i].x / 10)}%`, top: `${rev.points[hover.i].y - 12}px`, transform: 'translate(-50%,-100%)', background: '#3B2A22', color: 'rgba(248, 244, 238, 0.92)', padding: '9px 13px', borderRadius: '8px', fontSize: '11px', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 18px 40px -18px rgba(59, 42, 34, 0.55)', zIndex: 5 }}>
                  <div style={{ fontWeight: 600 }}>{d.labels[hover.i]}</div>
                  <div style={{ color: '#E9C9A6', marginTop: '3px' }}>{fmtIDR(rev.points[hover.i].v)}</div>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
