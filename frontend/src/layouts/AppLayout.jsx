import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Main app layout: sidebar (left) + header + scrollable content (right)
 * Passes pendingCount and onCreateRequest down via context if needed.
 */
export default function AppLayout() {
  const [pendingCount, setPendingCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateRequest = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#080d1a] text-slate-300">
      <Sidebar pendingCount={pendingCount} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onCreateRequest={handleCreateRequest} />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Pass context values to child routes via Outlet context */}
          <Outlet context={{ setPendingCount, showCreateModal, setShowCreateModal }} />
        </main>
      </div>
    </div>
  );
}
