"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

function SessionsActions({ client }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    sessionName: "",
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  // ✅ Fetch sessions (and auto-sync from WAHA through sessions.js)
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const result = await getCompanySessions(client.id);
      if (result.success) {
        setSessions(result.data || []);
      } else {
        toast.error(result.error || "Failed to fetch sessions");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Unexpected error occurred while fetching sessions");
    } finally {
      setLoading(false);
    }
  };

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
        "Only one session is allowed. Please delete the existing session first."
      );
      return;
    }

    try {
      setLoading(true);
      const result = await createWhatsAppSession(
        client.id,
        cleanedPhoneNumber,
        formData.sessionName || `Session-${cleanedPhoneNumber}`
      );

      if (result.success) {
        toast.success("Session created successfully!");
        setFormData({ phoneNumber: "", sessionName: "" });
        setAddDialogOpen(false);
        await fetchSessions();

        if (result.data) {
          setTimeout(() => {
            handleGetQRCode(result.data);
          }, 2000);
        }
      } else {
        toast.error(result.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Unexpected error occurred while creating session");
    } finally {
      setLoading(false);
    }
  };

  const handleGetQRCode = async (session) => {
    try {
      setQrLoading(true);
      setQrCode(null);
      setQrDialogOpen(true);

      const allowedStatuses = ["SCAN_QR_CODE", "STARTING"];
      const currentStatus = session.status?.toUpperCase();

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
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const result = await getSessionQRCode(session.id);

      if (result.success && result.data?.qr) {
        setQrCode(result.data.qr);
        await fetchSessions();
        toast.success("QR Code loaded successfully");
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
        fetchSessions();
      } else {
        toast.error(result.error || "Failed to stop session");
      }
    } catch (error) {
      console.error("Error stopping session:", error);
      toast.error("Unexpected error occurred while stopping session");
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
        fetchSessions();
      } else {
        toast.error(result.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Unexpected error occurred while deleting session");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (sessionId) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phoneNumber") {
      const numbersOnly = value.replace(/\D/g, "");
      let formattedValue = numbersOnly;

      if (numbersOnly.length > 3 && numbersOnly.length <= 6) {
        formattedValue = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      } else if (numbersOnly.length > 6) {
        formattedValue = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(
          3,
          6
        )}-${numbersOnly.slice(6, 10)}`;
      }

      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getStatusDisplay = (status) => {
    const upperStatus = status?.toUpperCase();

    const statusConfig = {
      WORKING: { label: "Working", class: "bg-green-100 text-green-800" },
      STARTING: { label: "Starting", class: "bg-yellow-100 text-yellow-800" },
      SCAN_QR_CODE: {
        label: "Scan QR",
        class: "bg-yellow-100 text-yellow-800",
      },
      STOPPED: { label: "Stopped", class: "bg-red-100 text-red-800" },
      FAILED: { label: "Failed", class: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[upperStatus] || {
      label: status || "Unknown",
      class: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`${config.class} px-2 py-1 rounded-sm text-xs font-medium`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">WhatsApp Sessions Management</h1>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Add a new WhatsApp session by entering the phone number and
                session name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name (Optional)</Label>
                <Input
                  id="sessionName"
                  name="sessionName"
                  type="text"
                  value={formData.sessionName}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Business Account"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateSession}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Session Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading sessions...
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No sessions found. Create your first session above.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.phone_number}
                  </TableCell>
                  <TableCell>
                    {session.session_name || `Session-${session.phone_number}`}
                  </TableCell>
                  <TableCell>{getStatusDisplay(session.status)}</TableCell>
                  <TableCell>
                    {new Date(session.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {session.status?.toUpperCase() !== "WORKING" && (
                          <DropdownMenuItem
                            onClick={() => handleGetQRCode(session)}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Scan QR Code
                          </DropdownMenuItem>
                        )}

                        {session.status?.toUpperCase() !== "STOPPED" && (
                          <DropdownMenuItem
                            onClick={() => handleStopSession(session)}
                          >
                            <StopCircle className="mr-2 h-4 w-4" />
                            Stop Session
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(session.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Session
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
    </div>
  );
}

export default SessionsActions;
