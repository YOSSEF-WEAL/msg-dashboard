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
 * - يدير جميع ال API calls و intervals و QR monitoring
 * - يبقي qrDialog state داخل ال hook لأنه متعلق بالمراقبة التلقائية
 */
export function useSessions(clientId) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false); // CRUD ops (create / delete / stop)
  const [refreshing, setRefreshing] = useState(false); // auto-refresh state
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const autoRefreshRef = useRef(null);
  const qrIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const UPDATE_INTERVAL = 3000;
  const QR_COUNTDOWN = 60 * 2;

  // fetchSessions (uses refreshing, not loading)
  const fetchSessions = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await getCompanySessions(clientId);
      if (res?.success) {
        setSessions(res.data || []);
      } else {
        toast.error(res?.error || "Failed to fetch sessions");
      }
    } catch (err) {
      console.error("fetchSessions error", err);
      toast.error("Unexpected error fetching sessions");
    } finally {
      setRefreshing(false);
    }
  }, [clientId]);

  // create session
  const createSession = useCallback(
    async (phoneNumber, sessionName) => {
      try {
        setLoading(true);
        const res = await createWhatsAppSession(
          clientId,
          phoneNumber,
          sessionName
        );
        if (res?.success) {
          toast.success("Session created");
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
    [clientId, fetchSessions]
  );

  // delete session
  const deleteSessionById = useCallback(
    async (sessionId) => {
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

  // stop session
  const stopSession = useCallback(
    async (session) => {
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

  // Close QR dialog and cleanup
  const closeQrDialog = useCallback(async () => {
    try {
      setQrDialogOpen(false);
      setCurrentSession(null);
      setQrCode(null);
      setCountdown(0);
      // clear intervals
      clearInterval(qrIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
      qrIntervalRef.current = null;
      countdownIntervalRef.current = null;
      // refresh sessions when closing
      await fetchSessions();
    } catch (err) {
      console.error("closeQrDialog error", err);
    }
  }, [fetchSessions]);

  // Internal: check session status by fetching latest sessions and finding this session
  const checkSessionStatus = useCallback(
    async (sessionId) => {
      try {
        const res = await getCompanySessions(clientId);
        if (res?.success) {
          const updated = (res.data || []).find((s) => s.id === sessionId);
          return updated || null;
        }
      } catch (err) {
        console.error("checkSessionStatus error", err);
      }
      return null;
    },
    [clientId]
  );

  // Start watching session status and QR countdown
  const openQRCode = useCallback(
    async (session) => {
      try {
        // open dialog UI
        setQrLoading(true);
        setQrCode(null);
        setCurrentSession(session);
        setQrDialogOpen(true);
        setCountdown(QR_COUNTDOWN);

        // if session not in SCAN_QR_CODE / STARTING -> request SCAN_QR_CODE
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
          // small delay to let backend set status
          await new Promise((r) => setTimeout(r, 1200));
        }

        // get QR
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

        // start countdown interval
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              toast.info("QR expired");
              // close dialog and cleanup
              closeQrDialog();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // start monitoring server-side status every 3s
        qrIntervalRef.current = setInterval(async () => {
          try {
            const updated = await checkSessionStatus(session.id);
            if (updated) {
              const st = (updated.status || "").toUpperCase();
              console.log("QR monitor - session:", updated.session_name, st);
              if (["WORKING", "FAILED", "STOPPED"].includes(st)) {
                // status changed -> close dialog & refresh
                toast.success(`Session ${st}`);
                clearInterval(qrIntervalRef.current);
                qrIntervalRef.current = null;
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
                setQrDialogOpen(false);
                setCurrentSession(null);
                setQrCode(null);
                setCountdown(0);
                await fetchSessions();
              } else {
                // also refresh sessions list so UI shows latest status
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
    [checkSessionStatus, closeQrDialog, fetchSessions]
  );

  // Expose a manual close method
  const manualCloseQRCode = useCallback(async () => {
    await closeQrDialog();
  }, [closeQrDialog]);

  // setup auto refresh when hook mounted
  useEffect(() => {
    fetchSessions();
    autoRefreshRef.current = setInterval(fetchSessions, UPDATE_INTERVAL);

    return () => {
      clearInterval(autoRefreshRef.current);
      clearInterval(qrIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [fetchSessions]);

  return {
    // data
    sessions,
    loading,
    refreshing,
    qrCode,
    qrLoading,
    qrDialogOpen,
    currentSession,
    countdown,

    // actions
    fetchSessions,
    createSession,
    deleteSessionById,
    stopSession,
    openQRCode,
    manualCloseQRCode,
  };
}
