"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import ComboboxCompanyForm from "./ComboboxCompanyForm";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateCompanyInformation } from "@/app/_actions/updates";
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
          "Save"
        )}
      </Button>
      <Button type="reset" variant="destructive" disabled={pending}>
        Cancel
      </Button>
    </div>
  );
}

export default function CompanyForm({
  client,
  companyInformation,
  countrys,
  industrys,
  paymentMethods,
}) {
  const [isPending, startTransition] = useTransition();
  const handleSubmit = async (formData) => {
    const plainData = Object.fromEntries(formData.entries());
    plainData.client_id = client?.id;
    startTransition(async () => {
      try {
        const result = await updateCompanyInformation(plainData);

        if (result.success) {
          toast.success(
            result.message || "Company information updated successfully"
          );
        } else {
          toast.error(result.error || "Failed to update company information");
        }
      } catch (err) {
        console.error("handleSubmit error:", err);
        toast.error("Unexpected error occurred");
      }
    });
  };

  const handleReset = (e) => {
    if (isPending) {
      e.preventDefault();
      return;
    }
  };

  return (
    <>
      <form
        action={handleSubmit}
        onReset={handleReset}
        className="flex flex-row flex-wrap gap-4"
      >
        <div className="w-full">
          <Image
            src={companyInformation?.logo_url || "/placeholder-logo.png"}
            alt={companyInformation?.company_name ?? "LOGO COMPANY"}
            width={50}
            height={50}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="company_name">company Name</Label>
          <Input
            type="text"
            id="company_name"
            name="company_name"
            placeholder="company Name"
            defaultValue={companyInformation?.company_name ?? ""}
            disabled={isPending}
            required
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="email">email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="email"
            defaultValue={companyInformation?.email ?? ""}
            disabled={isPending}
            required
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="address">address</Label>
          <Input
            type="text"
            id="address"
            name="address"
            placeholder="address"
            defaultValue={companyInformation?.address ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="phone_number">phone Number</Label>
          <Input
            type="tel"
            id="phone_number"
            name="phone_number"
            placeholder="phone Number"
            defaultValue={companyInformation?.phone_number ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="whatsapp_number">whatsapp Number</Label>
          <Input
            type="tel"
            id="whatsapp_number"
            name="whatsapp_number"
            placeholder="whatsapp Number"
            defaultValue={companyInformation?.whatsapp_number ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="country">country</Label>
          <ComboboxCompanyForm
            name="country"
            data={countrys}
            selectId={companyInformation?.country}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="industry">industry</Label>
          <ComboboxCompanyForm
            name="industry"
            data={industrys}
            selectId={companyInformation?.industry}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="payment_method">payment Method</Label>
          <ComboboxCompanyForm
            name="payment_method"
            data={paymentMethods}
            selectId={companyInformation?.payment}
            disabled={true}
          />
        </div>

        <SubmitButtons />
      </form>
    </>
  );
}
