import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";
import { getClient } from "../_actions/data-serves";
import { getCompanyInformation } from "../_actions/data-serves";
import { getCountrys } from "../_actions/data-serves";
import { getIndustrys } from "../_actions/data-serves";
import { getPaymentMethods } from "../_actions/data-serves";
import CompanyForm from "@/components/CompanyForm";

export default async function page() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const client = await getClient(data?.claims?.sub);
  const companyInformation = await getCompanyInformation(client?.company_id);
  const countrys = await getCountrys();
  const industrys = await getIndustrys();
  const paymentMethods = await getPaymentMethods();

  console.log("client data", client);
  console.log("companyInformation data", companyInformation);
  console.log("countrys data", countrys);
  console.log("industrys data", industrys);
  console.log("paymentMethods data", paymentMethods);

  return (
    <div className="">
      <CompanyForm
        client={client}
        companyInformation={companyInformation}
        countrys={countrys}
        industrys={industrys}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
