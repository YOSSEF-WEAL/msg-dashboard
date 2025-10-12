import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SessionForm({ formData, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 py-4">
      <div>
        <Label htmlFor="phoneNumber">Phone Number *</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={onChange}
          placeholder="e.g., 201234567890"
          required
        />
      </div>

      <div>
        <Label htmlFor="sessionName">Session Name</Label>
        <Input
          id="sessionName"
          name="sessionName"
          value={formData.sessionName}
          onChange={onChange}
          placeholder="e.g., Main Account"
        />
      </div>

      <div className="flex justify-end gap-2">
        {/* <Button type="reset" variant="outline">
          Reset
        </Button> */}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Session"}
        </Button>
      </div>
    </form>
  );
}
