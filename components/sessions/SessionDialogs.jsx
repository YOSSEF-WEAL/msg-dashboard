import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SessionForm from "./SessionForm";

/**
 * Props:
 * - addDialogOpen, setAddDialogOpen, onCreate, loading
 * - deleteDialogOpen, setDeleteDialogOpen, onConfirmDelete, deletingId
 * - qrDialogOpen, qrCode, qrLoading, countdown, currentSession, closeQr
 */
export default function SessionDialogs({
  addDialogOpen,
  setAddDialogOpen,
  onCreate,
  loading,

  deleteDialogOpen,
  setDeleteDialogOpen,
  onConfirmDelete,
  deletingId,

  qrDialogOpen,
  qrCode,
  qrLoading,
  countdown,
  currentSession,
  closeQr,
}) {
  // form state local to the dialog
  const [formData, setFormData] = useState({
    phoneNumber: "",
    sessionName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!addDialogOpen) {
      // reset form when dialog closes
      setFormData({ phoneNumber: "", sessionName: "" });
    }
  }, [addDialogOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // basic phone cleanup allow + and digits
    if (name === "phoneNumber") {
      let cleaned = value.replace(/[^\d+]/g, "");
      if (cleaned.startsWith("+")) {
        cleaned = "+" + cleaned.slice(1).replace(/\+/g, "");
      } else {
        cleaned = cleaned.replace(/\+/g, "");
      }
      setFormData((p) => ({ ...p, [name]: cleaned }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phoneNumber) return;
    // call parent's onCreate
    const cleaned = formData.phoneNumber.replace(/\D/g, "");
    const name = formData.sessionName.trim() || `Session-${cleaned}`;
    const res = await onCreate(cleaned, name);
    if (res?.success) {
      setAddDialogOpen(false);
    }
    // else leave dialog open so user can retry
  };

  return (
    <>
      {/* Add Session Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Enter phone number and optional session name.
            </DialogDescription>
          </DialogHeader>

          <SessionForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
          />

          <DialogFooter>
            {/* Buttons inside form already; keep this for layout parity */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              This will permanently delete the session (ID: {deletingId}). This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                try {
                  setIsDeleting(true);
                  await onConfirmDelete();
                  setDeleteDialogOpen(false);
                } catch (err) {
                  console.error("Error deleting session:", err);
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog (driven by hook state passed as props) */}
      <Dialog open={qrDialogOpen} onOpenChange={closeQr}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR with your WhatsApp app. Time remaining:{" "}
              <b>{countdown}s</b>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center py-6">
            {qrLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-foreground mx-auto mb-4" />
                <p>Loading QR Code...</p>
              </div>
            ) : qrCode ? (
              <img
                src={qrCode}
                alt="WhatsApp QR"
                className="w-64 h-64 border-2 border-accent-foreground rounded"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EQR Load Error%3C/text%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div className="text-center">
                <p>No QR available</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeQr}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
