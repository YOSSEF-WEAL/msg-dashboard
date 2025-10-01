"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ComboboxCompanyForm from "./ComboboxCompanyForm";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateCompanyInformation } from "@/app/_actions/updates";
import { toast } from "sonner";
import LogoUpload from "./LogoUpload";

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
  plans,
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
        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            type="text"
            id="company_name"
            name="company_name"
            placeholder="Company Name"
            defaultValue={companyInformation?.company_name ?? ""}
            disabled={isPending}
            required
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            defaultValue={companyInformation?.email ?? ""}
            disabled={isPending}
            required
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <Input
            type="text"
            id="address"
            name="address"
            placeholder="Address"
            defaultValue={companyInformation?.address ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            type="tel"
            id="phone_number"
            name="phone_number"
            placeholder="Phone Number"
            defaultValue={companyInformation?.phone_number ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
          <Input
            type="tel"
            id="whatsapp_number"
            name="whatsapp_number"
            placeholder="WhatsApp Number"
            defaultValue={companyInformation?.whatsapp_number ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <ComboboxCompanyForm
            name="country"
            data={countrys}
            selectId={companyInformation?.country}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="industry">Industry</Label>
          <ComboboxCompanyForm
            name="industry"
            data={industrys}
            selectId={companyInformation?.industry}
            disabled={isPending}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="plan">plans</Label>
          <ComboboxCompanyForm
            name="plan"
            data={plans}
            selectId={companyInformation?.plan}
            // disabled={isPending}
            disabled={true}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <ComboboxCompanyForm
            name="payment_method"
            data={paymentMethods}
            selectId={companyInformation?.payment}
            disabled={true}
          />
        </div>

        <SubmitButtons />

        <div className="w-full mt-4">
          <LogoUpload
            clientId={client?.id}
            currentLogo={companyInformation?.logo_url}
          />
        </div>
      </form>
    </>
  );
}
