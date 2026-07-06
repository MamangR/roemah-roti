"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  Cake,
  Gift,
  LayoutDashboard,
  QrCode,
  Search,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import { BreadMark } from "@/components/shared/BreadMark";
import { listAdminMembers, listBirthdaysThisWeek } from "@/services/member.service";
import { getVisitSummary } from "@/services/visit.service";
import type { AdminMemberRow } from "@/types/member";
import type { BirthdayPreview, VisitSummary } from "@/types/visit";

interface ExtendedVisitSummary extends VisitSummary {
  totalMembersChange?: string;
  activeMembersChange?: string;
  rewardsRedeemedChange?: string;
  birthdaysChange?: string;
}

const emptySummary: ExtendedVisitSummary = {
  totalMembers: "0",
  totalMembersChange: "0 this month",
  activeMembers: "0",
  activeMembersChange: "0 this week",
  rewardsRedeemed: "0",
  rewardsRedeemedChange: "0 today",
  birthdaysThisMonth: "0",
  birthdaysChange: "0 this month",
};

export function AdminDashboard() {
  const [members, setMembers] = useState<AdminMemberRow[]>([]);
  const [birthdays, setBirthdays] = useState<readonly BirthdayPreview[]>([]);
  const [summary, setSummary] = useState<ExtendedVisitSummary>(emptySummary);
  const [currentDate, setCurrentDate] = useState("");
  
  const navItems = [
    [LayoutDashboard, "Overview", true],
    [Users, "Members", false],
    [Award, "Rewards", false],
    [QrCode, "Scan visit", false],
    [BarChart3, "Reports", false],
  ] as const;

  useEffect(() => {
    let mounted = true;

    async function loadAdminData() {
      const [loadedMembers, loadedBirthdays, loadedSummary] = await Promise.all([
        listAdminMembers(),
        listBirthdaysThisWeek(),
        getVisitSummary(),
      ]);

      if (mounted) {
        setMembers(loadedMembers);
        setBirthdays(loadedBirthdays);
        setSummary(loadedSummary);
      }
    }

    void loadAdminData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const formatDateTime = () => {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
    };

    setCurrentDate(formatDateTime());

    const interval = setInterval(() => {
      setCurrentDate(formatDateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="adm-root">
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <div className="adm-logo-row">
            <div className="adm-logo-icon">
              <BreadMark />
            </div>
            <div>
              <div className="adm-logo-name">Roemah Roti</div>
              <div className="adm-logo-sub">Staff panel</div>
            </div>
          </div>
        </div>
        <nav className="adm-nav">
          {navItems.map(([Icon, label, active]) => (
            <div className={`adm-nav-item ${active ? "active" : ""}`} key={label}>
              <Icon size={16} /> {label}
            </div>
          ))}
          <div className="adm-nav-bottom">
            <div className="adm-nav-item">
              <Settings size={16} /> Settings
            </div>
          </div>
        </nav>
      </aside>

      <main className="adm-main">
        <div className="adm-topbar">
          <div>
            <h1>Good morning, Team</h1>
            <p>Here&apos;s what&apos;s happening at Roemah Roti today.</p>
          </div>
          <div className="adm-date">{currentDate}</div>
        </div>

        <div className="adm-stats">
          <AdminStat icon={<Users size={13} />} label="Total members" num={summary.totalMembers} change={summary.totalMembersChange || "0 this month"} />
          <AdminStat icon={<UserCheck size={13} />} label="Active members" num={summary.activeMembers} change={summary.activeMembersChange || "0 this week"} />
          <AdminStat icon={<Gift size={13} />} label="Rewards redeemed" num={summary.rewardsRedeemed} change={summary.rewardsRedeemedChange || "0 today"} />
          <AdminStat icon={<Cake size={13} />} label="Birthdays this month" num={summary.birthdaysThisMonth} change={summary.birthdaysChange || "0 this month"} />
        </div>

        <div className="adm-panels">
          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Members</span>
              <span className="adm-panel-action">Export -&gt;</span>
            </div>
            <div className="adm-search">
              <Search size={14} />
              <input type="text" placeholder="Search by name or phone..." />
            </div>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Visits</th>
                  <th>Last visit</th>
                  <th>Reward</th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="adm-member-name">{member.name}</div>
                      <div className="adm-member-phone">{member.phone}</div>
                    </td>
                    <td>{member.visits}</td>
                    <td>{member.lastVisit}</td>
                    <td>
                      <span className={`adm-badge ${member.rewardStatus}`}>{member.rewardLabel}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}>No members found in Firestore.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="adm-side-stack">
            <div className="adm-panel">
              <div className="adm-panel-header">
                <span className="adm-panel-title">Scan a visit</span>
              </div>
              <div className="adm-side-section">
                <div className="adm-scan-box">
                  <QrCode size={28} />
                  <p>Point camera at member&apos;s QR code to log a visit instantly</p>
                  <button className="adm-scan-btn">Open scanner</button>
                </div>
                <div className="adm-side-note">or search member above and add visit manually</div>
              </div>
            </div>

            <div className="adm-panel">
              <div className="adm-panel-header">
                <span className="adm-panel-title">Birthdays this week</span>
              </div>
              <div className="adm-side-section">
                {birthdays.length > 0 ? birthdays.map((birthday) => (
                  <Birthday key={birthday.name} initials={birthday.initials} name={birthday.name} date={birthday.date} />
                )) : <div className="adm-side-note">No birthdays found this week.</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminStat({ icon, label, num, change }: { icon: React.ReactNode; label: string; num: string; change: string }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-label">
        {icon} {label}
      </div>
      <div className="adm-stat-num">{num}</div>
      <div className="adm-stat-change">{change}</div>
    </div>
  );
}

function Birthday({ initials, name, date }: { initials: string; name: string; date: string }) {
  return (
    <div className="adm-birthday-item">
      <div className="adm-birthday-avatar">{initials}</div>
      <div>
        <div className="adm-birthday-name">{name}</div>
        <div className="adm-birthday-date">{date}</div>
      </div>
    </div>
  );
}