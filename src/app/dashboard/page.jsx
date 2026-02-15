"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiSession } from "@/lib/api";
import NoCompanyView from "@/components/dashboard/NoCompanyView";
import UserDashboard from "@/components/dashboard/UserDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    try {
      const data = await apiSession();
      if (!data) {
        router.push("/login");
        return;
      }
      setSession(data.user);
      setCompany(data.company);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <NoCompanyView onJoined={loadSession} />
      </div>
    );
  }

  if (session.role === "ADMIN") {
    return (
      <AdminDashboardOrUserToggle
        session={session}
        company={company}
        loadSession={loadSession}
      />
    );
  }

  return <UserDashboard user={session} company={company} onUserUpdated={loadSession} />;
}

function AdminDashboardOrUserToggle({ session, company, loadSession }) {
  const [viewAs, setViewAs] = useState("admin"); // "admin" | "user"

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 flex min-h-0 min-w-0">
        {viewAs === "user" ? (
          <UserDashboard
            user={session}
            company={company}
            onUserUpdated={loadSession}
            viewAs={viewAs}
            setViewAs={setViewAs}
          />
        ) : (
          <AdminDashboard
            user={session}
            company={company}
            onCompanyUpdated={loadSession}
            viewAs={viewAs}
            setViewAs={setViewAs}
          />
        )}
      </div>
    </div>
  );
}
