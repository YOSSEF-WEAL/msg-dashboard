import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import ComboboxCompanyForm from "./ComboboxCompanyForm";
import { Button } from "./ui/button";

export default async function CompanyForm({
  client,
  companyInformation,
  countrys,
  industrys,
  paymentMethods,
}) {
  return (
    <>
      <form className="flex flex-row flex-wrap gap-4">
        <div className="w-full">
          <Image
            src={companyInformation?.logo_url}
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
            placeholder="company Name"
            defaultValue={companyInformation?.company_name ?? ""}
          />
        </div>
        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="email">email</Label>
          <Input
            type="text"
            id="email"
            placeholder="email"
            defaultValue={companyInformation?.email ?? ""}
          />
        </div>
        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="address">address</Label>
          <Input
            type="text"
            id="address"
            placeholder="address"
            defaultValue={companyInformation?.address ?? ""}
          />
        </div>
        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="phone_number">phone Number</Label>
          <Input
            type="text"
            id="phone_number"
            placeholder="phone Number"
            defaultValue={companyInformation?.phone_number ?? ""}
          />
        </div>
        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="whatsapp_number">whatsapp Number</Label>
          <Input
            type="text"
            id="whatsapp_number"
            placeholder="whatsapp Number"
            defaultValue={companyInformation?.whatsapp_number ?? ""}
          />
        </div>
        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="country">country</Label>
          <ComboboxCompanyForm
            data={countrys}
            selectId={companyInformation?.country}
          />
        </div>

        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="industry">industry</Label>
          <ComboboxCompanyForm
            data={industrys}
            selectId={companyInformation?.industry}
          />
        </div>
        <div className="w-full md:w-[31%] flex flex-col gap-2">
          <Label htmlFor="payment_method">payment Method</Label>
          <ComboboxCompanyForm
            data={paymentMethods}
            selectId={client?.payment}
          />
        </div>
      </form>
      <div className="flex flex-row gap-2 mt-4">
        <Button type="submit" variant={"default"}>
          Save
        </Button>
        <Button type="reset" variant={"destructive"}>
          Cancel
        </Button>
      </div>
    </>
  );
}
