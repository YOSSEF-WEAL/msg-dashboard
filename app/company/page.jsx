import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";
import { getClient } from "../_actions/data-serves";
import { getCompanyInformation } from "../_actions/data-serves";
import { getCountrys } from "../_actions/data-serves";
import { getIndustrys } from "../_actions/data-serves";
import { getPaymentMethods } from "../_actions/data-serves";
import { getPlans } from "../_actions/data-serves";
import { getRoles } from "../_actions/data-serves";
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
  const plans = await getPlans();

  /*
  console.log("companyInformation data", companyInformation);
  console.log("client data", client);
  console.log("countrys data", countrys);
  console.log("industrys data", industrys);
  console.log("paymentMethods data", paymentMethods);
  console.log("plans data", plans);
  */

  return (
    <div className="">
      <CompanyForm
        client={client}
        companyInformation={companyInformation}
        countrys={countrys}
        industrys={industrys}
        paymentMethods={paymentMethods}
        plans={plans}
      />
    </div>
  );
}
