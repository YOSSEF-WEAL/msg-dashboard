"use client";

import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessions } from "./useSessions";
import SessionsTable from "./SessionsTable";
import SessionDialogs from "./SessionDialogs";

export default function SessionsActions({ client }) {
  const {
    sessions,
    refreshing,
    loading,
    qrDialogOpen,
    qrCode,
    qrLoading,
    countdown,
    currentSession,
    fetchSessions,
    createSession,
    deleteSessionById,
    stopSession,
    openQRCode,
    manualCloseQRCode,
  } = useSessions(client.id);

  // Dialog states that are UI-level (add & delete)
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // handlers
  const handleOpenAdd = () => setAddDialogOpen(true);
  const handleCloseAdd = () => setAddDialogOpen(false);

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    await deleteSessionById(sessionToDelete);
    setSessionToDelete(null);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">WhatsApp Sessions Management</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchSessions}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4  ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Reload Sessions"}
          </Button>

          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 " />
            Add Session
          </Button>
        </div>
      </div>

      <SessionsTable
        sessions={sessions}
        refreshing={refreshing}
        onScanQR={(s) => openQRCode(s)}
        onStop={(s) => stopSession(s)}
        onDelete={(s) => {
          setSessionToDelete(s.id);
          setDeleteDialogOpen(true);
        }}
      />

      <SessionDialogs
        // Add
        addDialogOpen={addDialogOpen}
        setAddDialogOpen={setAddDialogOpen}
        onCreate={async (phone, name) => {
          const res = await createSession(phone, name);
          if (res?.success && res?.data) {
            // after creation, open QR automatically (hook will prepare)
            // slight delay to let backend be ready
            setTimeout(() => openQRCode(res.data), 700);
          }
          return res;
        }}
        loading={loading}
        // Delete
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        onConfirmDelete={handleConfirmDelete}
        deletingId={sessionToDelete}
        // QR Dialog (hook-driven)
        qrDialogOpen={qrDialogOpen}
        qrCode={qrCode}
        qrLoading={qrLoading}
        countdown={countdown}
        currentSession={currentSession}
        closeQr={manualCloseQRCode}
      />
    </div>
  );
}
