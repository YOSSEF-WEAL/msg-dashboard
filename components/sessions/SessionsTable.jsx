import React from "react";
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
import { EllipsisVertical, QrCode, Trash2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionsTable({
  sessions = [],
  refreshing,
  onScanQR,
  onStop,
  onDelete,
}) {
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
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                {refreshing ? "Loading sessions..." : "No sessions found."}
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.phone_number}</TableCell>
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
                        <DropdownMenuItem onClick={() => onScanQR(s)}>
                          <QrCode className="h-4 w-4 " /> Scan QR
                        </DropdownMenuItem>
                      )}
                      {s.status?.toUpperCase() !== "STOPPED" && (
                        <DropdownMenuItem onClick={() => onStop(s)}>
                          <StopCircle className="h-4 w-4 " /> Stop
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(s)}>
                        <Trash2 className="h-4 w-4 " /> Delete
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
  );
}
