import { useState } from 'react';
import { Bell, CheckCheck, Sparkles, Vote, Activity, X } from 'lucide-react';
import type { DashboardNotification } from '../../types/civic';

interface NotificationPanelProps {
  open: boolean;
  notifications: DashboardNotification[];
  audience: 'citizen' | 'admin';
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onSelectNotification: (notif: DashboardNotification) => void;
}

export function NotificationPanel({
  open,
  notifications,
  audience,
  onClose,
  onMarkAllRead,
  onMarkRead,
  onSelectNotification,
}: NotificationPanelProps) {
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  if (!open) return null;

  const relevant = notifications.filter(
    (n) => n.audience === 'both' || n.audience === audience,
  );
  const visible =
    tab === 'unread' ? relevant.filter((n) => !n.read) : relevant;
  const unreadCount = relevant.filter((n) => !n.read).length;

  const renderIcon = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'vote':
        return <Vote className="h-4 w-4 text-[#059669]" />;
      case 'status':
        return <Activity className="h-4 w-4 text-[#065F46]" />;
      case 'action':
        return <Sparkles className="h-4 w-4 text-[#D97706]" />;
      default:
        return <Bell className="h-4 w-4 text-[#059669]" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full mt-2 z-50 w-[360px] sm:w-[400px] rounded-xl border border-[#DCE7E1] bg-white shadow-[0_12px_32px_-8px_rgba(12,35,27,0.18),0_2px_6px_rgba(12,35,27,0.06)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5EFE9] px-4 py-3 bg-[#F9FCFA]">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-[#0F2920]">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-semibold text-[#065F46] tabular-nums">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#059669]" />
              </span>
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#059669] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-md p-1 text-[#527064] hover:bg-[#EBF3EE] hover:text-[#0F2920] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5EFE9] px-4 py-2 bg-white">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
            tab === 'all'
              ? 'bg-[#065F46] text-white'
              : 'text-[#527064] hover:bg-[#F3F8F5]'
          }`}
        >
          All ({relevant.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('unread')}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
            tab === 'unread'
              ? 'bg-[#065F46] text-white'
              : 'text-[#527064] hover:bg-[#F3F8F5]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-[#EEF5F1]">
        {visible.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-[#0F2920]">All caught up</p>
            <p className="mt-1 text-xs text-[#527064]">
              No unread notifications in this queue.
            </p>
          </div>
        ) : (
          visible.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onMarkRead(item.id);
                onSelectNotification(item);
              }}
              className={`flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                item.read
                  ? 'bg-white hover:bg-[#F7FAF8]'
                  : 'bg-[#F2FBF6] hover:bg-[#E8F8EF]'
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#DCE7E1] bg-white shadow-xs">
                {renderIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-[#0F2920] leading-snug">
                    {item.title}
                  </p>
                  {!item.read && (
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#10B981]"
                      aria-label="Unread"
                    />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#527064] leading-relaxed">
                  {item.message}
                </p>
                <span className="mt-1.5 block font-mono text-[10px] text-[#6B877B]">
                  {item.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
