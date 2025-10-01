"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFormStatus } from "react-dom";
import { useTransition, useState } from "react";
import { Loader2, Shield, Building, Mail, User } from "lucide-react";
import { updateAccountInformation } from "@/app/_actions/updates";
import { toast } from "sonner";

function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-row gap-2 mt-6 w-full">
      <Button type="submit" variant="default" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
      <Button type="reset" variant="destructive" disabled={pending}>
        Cancel
      </Button>
    </div>
  );
}

function formatPermissions(permissions) {
  if (!permissions) return [];

  const permissionList = [];

  if (permissions.all) {
    return ["Full Access to All Features"];
  }

  if (permissions.company?.all) {
    permissionList.push("Full Company Access");
  }
  if (permissions.company?.settings) {
    permissionList.push("Company Settings");
  }
  if (permissions.company?.users) {
    permissionList.push("Manage Users");
  }
  if (permissions.billing) {
    permissionList.push("Billing Management");
  }
  if (permissions.sessions) {
    permissionList.push("WhatsApp Sessions");
  }
  if (permissions.contacts) {
    permissionList.push("Contact Management");
  }
  if (permissions.messages) {
    permissionList.push("Send Messages");
  }
  if (permissions.campaigns) {
    permissionList.push("Campaign Management");
  }
  if (permissions.analytics) {
    permissionList.push("View Analytics");
  }

  return permissionList.length > 0 ? permissionList : ["Basic Access"];
}

export default function AccountForm({ client }) {
  const [isPending, startTransition] = useTransition();

  const clientData = client || {};
  const roleData = clientData.roles || {};
  const companyData = clientData.company_id || {};

  const handleSubmit = async (formData) => {
    const plainData = Object.fromEntries(formData.entries());
    plainData.client_id = clientData.id;
    plainData.is_active = formData.get("is_active") === "on";

    startTransition(async () => {
      try {
        const result = await updateAccountInformation(plainData);

        if (result.success) {
          toast.success(
            result.message || "Account information updated successfully"
          );
        } else {
          toast.error(result.error || "Failed to update account information");
        }
      } catch (err) {
        console.error("handleSubmit error:", err);
        toast.error("Unexpected error occurred while updating account");
      }
    });
  };

  const permissionsList = formatPermissions(roleData.permissions);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            The company you belong to and your access level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {companyData.logo_url ? (
              <img
                src={companyData.logo_url}
                alt="Company Logo"
                className="w-12 h-12 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center border">
                <Building className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {companyData.company_name || "No Company Name"}
              </h3>
              <p className="text-sm text-gray-500">Your affiliated company</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Permissions & Role
          </CardTitle>
          <CardDescription>
            What you can do in the system based on your role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="text-sm">
              {roleData.name || "No Role Assigned"}
            </Badge>
          </div>

          <div>
            <h4 className="font-medium mb-2">Available Permissions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissionsList.map((permission, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {permission}
                </div>
              ))}
            </div>
          </div>

          {roleData.description && (
            <div className="mt-4 p-3 bg-accent rounded-lg">
              <p className="text-sm text-primary">{roleData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  defaultValue={clientData.name || ""}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  defaultValue={clientData.email || ""}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={clientData.is_active}
                className="w-4 h-4"
                disabled={isPending}
              />
              <Label htmlFor="is_active" className="text-sm">
                Account is active
              </Label>
            </div>

            <div className="pt-4">
              <SubmitButtons />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Additional information about your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Created At:</span>
              <p className="text-accent-foreground">
                {new Date(clientData.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium">Subscription:</span>
              <p className="text-accent-foreground">
                {clientData.is_subscriber ? "Premium" : "Free Trial"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
