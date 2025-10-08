"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { useSessions } from "./useSessions";
import SessionsTable from "./SessionsTable";
import SessionDialogs from "./SessionDialogs";

// Wrap whole component in dynamic to disable SSR rendering
export default dynamic(
  () =>
    Promise.resolve(function SessionsActions() {
      const {
        client,
        isLoading: clientLoading,
        error: clientError,
      } = useSelector((state) => state.user);

      const companyId = client?.company_information?.id;
      const [addDialogOpen, setAddDialogOpen] = useState(false);
      const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
      const [sessionToDelete, setSessionToDelete] = useState(null);

      // FIXED: Always call useSessions hook, pass companyId (even if null)
      // The hook internally handles the null case
      const sessionHook = useSessions(companyId);

      if (clientLoading) {
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading your account information...
            </p>
          </div>
        );
      }

      if (clientError) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-red-600">
            <AlertTriangle className="w-6 h-6 mb-2" />
            <p className="font-medium">Failed to load client data</p>
            <p className="text-sm text-gray-500">{clientError}</p>
          </div>
        );
      }

      if (!companyId) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertTriangle className="w-6 h-6 mb-2" />
            <p>No company found. Please complete company setup.</p>
          </div>
        );
      }

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
        error,
      } = sessionHook;

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
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Reload Sessions"}
              </Button>

              <Button onClick={() => setAddDialogOpen(true)} disabled={loading}>
                <Plus className="h-4 w-4" />
                Add Session
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-4 border border-red-300 text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

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
            addDialogOpen={addDialogOpen}
            setAddDialogOpen={setAddDialogOpen}
            onCreate={async (phone, name) => {
              const res = await createSession(phone, name);
              if (res?.success && res?.data) {
                setTimeout(() => openQRCode(res.data), 700);
              }
              return res;
            }}
            loading={loading}
            deleteDialogOpen={deleteDialogOpen}
            setDeleteDialogOpen={setDeleteDialogOpen}
            onConfirmDelete={handleConfirmDelete}
            deletingId={sessionToDelete}
            qrDialogOpen={qrDialogOpen}
            qrCode={qrCode}
            qrLoading={qrLoading}
            countdown={countdown}
            currentSession={currentSession}
            closeQr={manualCloseQRCode}
          />
        </div>
      );
    }),
  { ssr: false }
);
