"use client";

import { useState } from "react";
import type { Link } from "@/types";
import { deleteLink, bulkDeleteLinks, bulkUpdateLinks } from "@/lib/api";
import { Trash2, Edit, BarChart3, QrCode, ExternalLink } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import ConfirmDialog from "./ConfirmDialog";

type ConfirmAction = 
  | { type: "delete"; id: string }
  | { type: "bulk-delete"; count: number }
  | { type: "bulk-deactivate"; count: number };

export function LinksList({
  links,
  onUpdate,
}: {
  links: Link[];
  onUpdate: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showQR, setShowQR] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map((l) => l.id)));
    }
  };

  const handleDelete = (id: string) => {
    setConfirmAction({ type: "delete", id });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmAction({ type: "bulk-delete", count: selectedIds.size });
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.size === 0) return;
    setConfirmAction({ type: "bulk-deactivate", count: selectedIds.size });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    setDeleting(true);
    try {
      if (confirmAction.type === "delete") {
        await deleteLink(confirmAction.id);
        onUpdate();
      } else if (confirmAction.type === "bulk-delete") {
        await bulkDeleteLinks(Array.from(selectedIds));
        setSelectedIds(new Set());
        onUpdate();
      } else if (confirmAction.type === "bulk-deactivate") {
        await bulkUpdateLinks(Array.from(selectedIds), { is_active: false });
        setSelectedIds(new Set());
        onUpdate();
      }
    } catch (error) {
      alert(`Failed to ${confirmAction.type.replace("-", " ")}`);
    } finally {
      setDeleting(false);
    }
  };

  const getConfirmDialogProps = () => {
    if (!confirmAction) return null;

    switch (confirmAction.type) {
      case "delete":
        return {
          title: "Delete Link",
          message: "Are you sure you want to delete this link? This action cannot be undone.",
          confirmText: "Delete",
          variant: "danger" as const,
        };
      case "bulk-delete":
        return {
          title: "Delete Multiple Links",
          message: `Are you sure you want to delete ${confirmAction.count} selected link(s)? This action cannot be undone.`,
          confirmText: `Delete ${confirmAction.count} Link${confirmAction.count > 1 ? "s" : ""}`,
          variant: "danger" as const,
        };
      case "bulk-deactivate":
        return {
          title: "Deactivate Multiple Links",
          message: `Are you sure you want to deactivate ${confirmAction.count} selected link(s)?`,
          confirmText: `Deactivate ${confirmAction.count} Link${confirmAction.count > 1 ? "s" : ""}`,
          variant: "warning" as const,
        };
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getShortUrl = (code: string) => {
    return `${window.location.origin}/${code}`;
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No links yet. Create your first short link!
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          onClick={toggleSelectAll}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {selectedIds.size === links.length ? "Deselect All" : "Select All"}
        </button>
        {selectedIds.size > 0 && (
          <>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Delete ({selectedIds.size})
            </button>
            <button
              onClick={handleBulkDeactivate}
              disabled={deleting}
              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Deactivate ({selectedIds.size})
            </button>
          </>
        )}
      </div>

      <div className="space-y-2">
        {links.map((link) => {
          const shortUrl = getShortUrl(link.short_code);
          const isExpired =
            link.expires_at && link.expires_at < Date.now();
          const isMaxClicks =
            link.max_clicks &&
            link.click_count >= link.max_clicks;
          const isInactive = !link.is_active || isExpired || isMaxClicks;

          return (
            <div
              key={link.id}
              className={`p-4 rounded border ${
                isInactive
                  ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700"
              } ${
                selectedIds.has(link.id)
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(link.id)}
                  onChange={() => toggleSelect(link.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                          {shortUrl}
                        </a>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                        {isInactive && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                            {!link.is_active
                              ? "Inactive"
                              : isExpired
                              ? "Expired"
                              : "Max Clicks"}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {link.original_url}
                      </div>
                      {link.title && (
                        <div className="text-sm font-medium mt-1">
                          {link.title}
                        </div>
                      )}
                      {link.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {link.description}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Created: {formatDate(link.created_at)}</span>
                        <span>Clicks: {link.click_count}</span>
                        {link.expires_at && (
                          <span>Expires: {formatDate(link.expires_at)}</span>
                        )}
                        {link.max_clicks && (
                          <span>Max: {link.max_clicks}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowQR(shortUrl)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <a
                        href={`/dashboard/${link.short_code}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showQR && (
        <QRCodeModal shortUrl={showQR} onClose={() => setShowQR(null)} />
      )}

      {confirmAction && getConfirmDialogProps() && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmedAction}
          {...getConfirmDialogProps()!}
        />
      )}
    </>
  );
}

