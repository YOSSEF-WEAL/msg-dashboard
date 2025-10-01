"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import { uploadCompanyLogo } from "@/app/_actions/updates";
import { Loader2 } from "lucide-react";

export default function LogoUpload({ clientId, currentLogo }) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(
    currentLogo || "/placeholder-logo.png"
  );
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    handleUpload(file);
  };

  const handleUpload = async (file) => {
    if (!clientId) {
      toast.error("Client ID not found");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);

      const result = await uploadCompanyLogo(formData);

      if (result.success) {
        toast.success("Logo updated successfully!");
        if (result.data?.logo_url) {
          setPreviewUrl(result.data.logo_url);
        }
      } else {
        toast.error(result.error || "Failed to upload logo");
        setPreviewUrl(currentLogo || "/placeholder-logo.png");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
      setPreviewUrl(currentLogo || "/placeholder-logo.png");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <div className="flex flex-col items-center">
        <Image
          src={previewUrl}
          alt="Company Logo"
          width={100}
          height={100}
          className="rounded-lg border object-cover"
        />
        <span className="text-sm text-gray-500 mt-2">Current Logo</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <Button
          onClick={triggerFileInput}
          disabled={isUploading}
          variant="outline"
          size="sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Change Logo"
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Supports: JPG, PNG, GIF, WEBP
          <br />
          Max size: 2MB
        </p>
      </div>
    </div>
  );
}
