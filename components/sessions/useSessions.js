import { useState, useEffect, useRef, useCallback } from "react";
import {
  createWhatsAppSession,
  getCompanySessions,
  deleteSession,
  getSessionQRCode,
  updateSessionStatus,
} from "@/app/_actions/sessions";
import { toast } from "sonner";

/**
 * useSessions hook
 * Manages all API calls, intervals, and QR monitoring.
 */
export function useSessions(companyId) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState(null);

  const autoRefreshRef = useRef(null);
  const qrIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const UPDATE_INTERVAL = 3000;
  const QR_COUNTDOWN = 60 * 2;

  // Fetch sessions
  const fetchSessions = useCallback(
    async (showLoading = false) => {
      if (!companyId) return;

      try {
        if (showLoading) setRefreshing(true);
        setError(null);

        const res = await getCompanySessions(companyId);
        if (res?.success) {
          setSessions((prev) => {
            const newData = res.data || [];
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(newData);
            return hasChanged ? newData : prev;
          });
        } else {
          const errorMsg = res?.error || "Failed to fetch sessions";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (err) {
        console.error("fetchSessions error", err);
        const errorMsg = "Unexpected error fetching sessions";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        if (showLoading) setRefreshing(false);
      }
    },
    [companyId]
  );

  // Create session
  const createSession = useCallback(
    async (phoneNumber, sessionName) => {
      if (!companyId) {
        toast.error("Missing company ID. Please reload your account.");
        return { success: false, error: "Missing company ID" };
      }

      try {
        setLoading(true);
        const res = await createWhatsAppSession(
          companyId,
          phoneNumber,
          sessionName
        );
        if (res?.success) {
          toast.success("Session created successfully");
          await fetchSessions();
          return { success: true, data: res.data };
        } else {
          toast.error(res?.error || "Failed to create session");
          return { success: false, error: res?.error };
        }
      } catch (err) {
        console.error("createSession error", err);
        toast.error("Unexpected error creating session");
        return { success: false, error: err?.message || err };
      } finally {
        setLoading(false);
      }
    },
    [companyId, fetchSessions]
  );

  // Delete session
  const deleteSessionById = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      try {
        setLoading(true);
        const res = await deleteSession(sessionId);
        if (res?.success) {
          toast.success("Session deleted");
          await fetchSessions();
          return { success: true };
        } else {
          toast.error(res?.error || "Failed to delete session");
          return { success: false, error: res?.error };
        }
      } catch (err) {
        console.error("deleteSession error", err);
        toast.error("Unexpected error deleting session");
        return { success: false, error: err?.message || err };
      } finally {
        setLoading(false);
      }
    },
    [fetchSessions]
  );

  // Stop session
  const stopSession = useCallback(
    async (session) => {
      if (!session?.id) return;
      try {
        setLoading(true);
        const res = await updateSessionStatus(
          session.waha_session_id,
          session.id,
          "STOPPED"
        );
        if (res?.success) {
          toast.success("Session stopped");
          await fetchSessions();
          return { success: true };
        } else {
          toast.error(res?.error || "Failed to stop session");
          return { success: false, error: res?.error };
        }
      } catch (err) {
        console.error("stopSession error", err);
        toast.error("Unexpected error stopping session");
        return { success: false, error: err?.message || err };
      } finally {
        setLoading(false);
      }
    },
    [fetchSessions]
  );

  // Close QR dialog
  const closeQrDialog = useCallback(async () => {
    try {
      setQrDialogOpen(false);
      setCurrentSession(null);
      setQrCode(null);
      setCountdown(0);
      clearInterval(qrIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
      qrIntervalRef.current = null;
      countdownIntervalRef.current = null;
      await fetchSessions();
    } catch (err) {
      console.error("closeQrDialog error", err);
    }
  }, [fetchSessions]);

  // Check session status
  const checkSessionStatus = useCallback(
    async (sessionId) => {
      if (!companyId) return null;
      try {
        const res = await getCompanySessions(companyId);
        if (res?.success) {
          const updated = (res.data || []).find((s) => s.id === sessionId);
          return updated || null;
        }
      } catch (err) {
        console.error("checkSessionStatus error", err);
      }
      return null;
    },
    [companyId]
  );

  // Open QR code
  const openQRCode = useCallback(
    async (session) => {
      if (!companyId || !session?.id) {
        toast.error("Missing company or session data");
        return;
      }

      try {
        setQrLoading(true);
        setQrCode(null);
        setCurrentSession(session);
        setQrDialogOpen(true);
        setCountdown(QR_COUNTDOWN);

        const curStatus = (session.status || "").toUpperCase();
        const allowed = ["SCAN_QR_CODE", "STARTING"];

        if (!allowed.includes(curStatus)) {
          const statusResult = await updateSessionStatus(
            session.waha_session_id,
            session.id,
            "SCAN_QR_CODE"
          );
          if (!statusResult?.success) {
            toast.error("Failed to prepare session for scanning");
            setQrDialogOpen(false);
            setQrLoading(false);
            return;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }

        const qrRes = await getSessionQRCode(session.id);
        if (!qrRes?.success || !qrRes.data?.qr) {
          toast.error(qrRes?.error || "Failed to get QR code");
          setQrDialogOpen(false);
          setQrLoading(false);
          return;
        }

        setQrCode(qrRes.data.qr);
        toast.success("QR code ready");
        setQrLoading(false);

        // Countdown timer
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              toast.info("QR expired");
              closeQrDialog();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Status monitoring
        qrIntervalRef.current = setInterval(async () => {
          try {
            const updated = await checkSessionStatus(session.id);
            if (updated) {
              const st = (updated.status || "").toUpperCase();
              if (["WORKING", "FAILED", "STOPPED"].includes(st)) {
                toast.success(`Session ${st}`);
                clearInterval(qrIntervalRef.current);
                clearInterval(countdownIntervalRef.current);
                qrIntervalRef.current = null;
                countdownIntervalRef.current = null;
                setQrDialogOpen(false);
                setCurrentSession(null);
                setQrCode(null);
                setCountdown(0);
                await fetchSessions();
              } else {
                await fetchSessions();
              }
            }
          } catch (err) {
            console.error("qrInterval monitor error", err);
          }
        }, UPDATE_INTERVAL);
      } catch (err) {
        console.error("openQRCode error", err);
        toast.error("Unexpected error while preparing QR");
        setQrLoading(false);
        setQrDialogOpen(false);
      }
    },
    [checkSessionStatus, closeQrDialog, fetchSessions, companyId]
  );

  const manualCloseQRCode = useCallback(async () => {
    await closeQrDialog();
  }, [closeQrDialog]);

  // Initial setup - only run when companyId is available
  useEffect(() => {
    if (!companyId) return;

    fetchSessions(true);

    autoRefreshRef.current = setInterval(
      () => fetchSessions(false),
      UPDATE_INTERVAL
    );

    // Cleanup on unmount or when companyId changes
    return () => {
      clearInterval(autoRefreshRef.current);
      clearInterval(qrIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [fetchSessions, companyId]);

  return {
    sessions,
    loading,
    refreshing,
    qrCode,
    qrLoading,
    qrDialogOpen,
    currentSession,
    countdown,
    error,
    fetchSessions,
    createSession,
    deleteSessionById,
    stopSession,
    openQRCode,
    manualCloseQRCode,
  };
}
