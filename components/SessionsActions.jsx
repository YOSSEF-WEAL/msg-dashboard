"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  createWhatsAppSession,
  getCompanySessions,
  deleteSession,
  getSessionQRCode,
  updateSessionStatus,
} from "@/app/_actions/sessions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EllipsisVertical,
  Plus,
  QrCode,
  Trash2,
  StopCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

function SessionsActions({ client }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false); // عمليات create/delete/stop
  const [refreshing, setRefreshing] = useState(false); // تحديث تلقائي / زرار reload
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    sessionName: "",
  });

  const qrIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const autoRefreshRef = useRef(null);

  const countdownQR = 60 * 2;
  const updateSessions = 3000;

  // Fetch sessions (uses refreshing state, NOT loading)
  const fetchSessions = async () => {
    try {
      setRefreshing(true);
      const result = await getCompanySessions(client.id);
      if (result.success) {
        setSessions(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch sessions");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Unexpected error fetching sessions");
    } finally {
      setRefreshing(false);
    }
  };

  // Auto refresh every 3 seconds
  useEffect(() => {
    // initial load + start interval
    fetchSessions();
    autoRefreshRef.current = setInterval(fetchSessions, updateSessions);

    return () => {
      clearInterval(autoRefreshRef.current);
      clearInterval(qrIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Refresh when dialogs close
  useEffect(() => {
    if (!addDialogOpen && !deleteDialogOpen && !qrDialogOpen) {
      fetchSessions();
    }
  }, [addDialogOpen, deleteDialogOpen, qrDialogOpen]);

  // Reset countdown and clear QR intervals when QR dialog closes
  useEffect(() => {
    if (!qrDialogOpen) {
      clearInterval(qrIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
      setCountdown(countdownQR);
    }
  }, [qrDialogOpen]);

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!formData.phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }

    const cleanedPhoneNumber = formData.phoneNumber.replace(/\D/g, "");
    if (cleanedPhoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const activeSessions = sessions.filter(
      (session) =>
        session.status === "connected" || session.status === "pending"
    );
    if (activeSessions.length > 0) {
      toast.error(
        "Only one session is allowed. Please delete the existing one first."
      );
      return;
    }

    try {
      setLoading(true);
      const result = await createWhatsAppSession(
        client.id,
        cleanedPhoneNumber,
        formData.sessionName.trim() || `Session-${cleanedPhoneNumber}`
      );
      if (result.success) {
        toast.success("Session created successfully!");
        setFormData({ phoneNumber: "", sessionName: "" });
        setAddDialogOpen(false);
        await fetchSessions();

        if (result.data) {
          // Give backend a moment then open QR dialog
          setTimeout(() => handleGetQRCode(result.data), 1500);
        }
      } else {
        toast.error(result.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Unexpected error creating session");
    } finally {
      setLoading(false);
    }
  };

  // Check session status directly from server (uses getCompanySessions)
  const updateSessionFromWAHA = async (session) => {
    try {
      const result = await getCompanySessions(client.id); // get fresh list
      if (result.success && Array.isArray(result.data)) {
        const updated = result.data.find((s) => s.id === session.id);
        if (updated) {
          const status = (updated.status || "").toUpperCase();
          console.log(
            "🔍 Checking session:",
            updated.session_name,
            "→",
            status
          );

          // If status changed to any of these, close QR dialog and refresh table
          if (["WORKING", "FAILED", "STOPPED"].includes(status)) {
            toast.success(`Session status changed: ${status}`);
            clearInterval(qrIntervalRef.current);
            clearInterval(countdownIntervalRef.current);
            setQrDialogOpen(false);
            await fetchSessions();
          }
        }
      }
    } catch (error) {
      console.error("Error updating session from WAHA:", error);
    }
  };

  // Get QR Code and start monitoring (QR-specific loading is qrLoading)
  const handleGetQRCode = async (session) => {
    try {
      setQrLoading(true);
      setQrCode(null);
      setQrDialogOpen(true);
      setCurrentSession(session);
      setCountdown(countdownQR);

      const allowedStatuses = ["SCAN_QR_CODE", "STARTING"];
      const currentStatus = (session.status || "").toUpperCase();

      if (!allowedStatuses.includes(currentStatus)) {
        toast.info("Preparing session for QR scan...");
        const statusResult = await updateSessionStatus(
          session.waha_session_id,
          session.id,
          "SCAN_QR_CODE"
        );
        if (!statusResult.success) {
          toast.error("Failed to prepare session for scanning");
          setQrDialogOpen(false);
          setQrLoading(false);
          return;
        }
        await fetchSessions();
        await new Promise((r) => setTimeout(r, 1200));
      }

      const result = await getSessionQRCode(session.id);
      if (result.success && result.data?.qr) {
        setQrCode(result.data.qr);
        toast.success("QR Code loaded successfully");

        // countdown timer for QR expiration
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              toast.info("QR Code expired. Please try again.");
              setQrDialogOpen(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // monitor session status every 3 seconds from server
        qrIntervalRef.current = setInterval(() => {
          updateSessionFromWAHA(session);
        }, updateSessions);
      } else {
        toast.error(result.error || "Failed to get QR code");
        setQrDialogOpen(false);
      }
    } catch (error) {
      console.error("Error getting QR code:", error);
      toast.error("Unexpected error occurred while getting QR code");
      setQrDialogOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleStopSession = async (session) => {
    try {
      setLoading(true);
      const result = await updateSessionStatus(
        session.waha_session_id,
        session.id,
        "STOPPED"
      );
      if (result.success) {
        toast.success("Session stopped successfully!");
        await fetchSessions();
      } else {
        toast.error(result.error || "Failed to stop session");
      }
    } catch (error) {
      console.error("Error stopping session:", error);
      toast.error("Unexpected error stopping session");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      setLoading(true);
      const result = await deleteSession(sessionToDelete);
      if (result.success) {
        toast.success("Session deleted successfully!");
        setDeleteDialogOpen(false);
        setSessionToDelete(null);
        await fetchSessions();
      } else {
        toast.error(result.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Unexpected error deleting session");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id) => {
    setSessionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      let cleanedValue = value.replace(/[^\d+]/g, "");
      if (cleanedValue.startsWith("+")) {
        cleanedValue = "+" + cleanedValue.slice(1).replace(/\+/g, "");
      } else {
        cleanedValue = cleanedValue.replace(/\+/g, "");
      }
      setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getStatusDisplay = (status) => {
    const upper = (status || "").toUpperCase();
    const map = {
      WORKING: { label: "Working", class: "bg-green-100 text-green-800" },
      STARTING: { label: "Starting", class: "bg-yellow-100 text-yellow-800" },
      SCAN_QR_CODE: {
        label: "Scan QR",
        class: "bg-yellow-100 text-yellow-800",
      },
      STOPPED: { label: "Stopped", class: "bg-red-100 text-red-800" },
      FAILED: { label: "Failed", class: "bg-red-100 text-red-800" },
    };
    const cfg = map[upper] || {
      label: status || "Unknown",
      class: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`${cfg.class} px-2 py-1 rounded-sm text-xs font-medium`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">WhatsApp Sessions Management</h1>

        <div className="flex gap-2">
          {/* Reload: uses refreshing (not loading) */}
          <Button
            variant="outline"
            onClick={fetchSessions}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Reload Sessions"}
          </Button>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
                <DialogDescription>
                  Enter phone number & session name.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label>Session Name</Label>
                  <Input
                    name="sessionName"
                    value={formData.sessionName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                {/* Create button disabled only when loading (create in progress) */}
                <Button onClick={handleCreateSession} disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {refreshing
                    ? "Loading sessions..."
                    : "No sessions found. Create one."}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.phone_number}
                  </TableCell>
                  <TableCell>
                    {s.session_name || `Session-${s.phone_number}`}
                  </TableCell>
                  <TableCell>{getStatusDisplay(s.status)}</TableCell>
                  <TableCell>
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.status?.toUpperCase() !== "WORKING" && (
                          <DropdownMenuItem onClick={() => handleGetQRCode(s)}>
                            <QrCode className="h-4 w-4 mr-2" /> Scan QR
                          </DropdownMenuItem>
                        )}
                        {s.status?.toUpperCase() !== "STOPPED" && (
                          <DropdownMenuItem
                            onClick={() => handleStopSession(s)}
                          >
                            <StopCircle className="h-4 w-4 mr-2" /> Stop
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(s.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* QR DIALOG */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR with WhatsApp app. Time remaining:{" "}
              <b>{countdown}s</b>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center py-6">
            {qrLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-foreground mx-auto mb-4"></div>
                <p>Loading QR Code...</p>
              </div>
            ) : qrCode ? (
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64 border-2 border-accent-foreground rounded"
                onError={(e) => {
                  console.error("Image failed to load");
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EQR Load Error%3C/text%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div className="text-center text-accent-foreground">
                <p>No QR code available</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSessionToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SessionsActions;
