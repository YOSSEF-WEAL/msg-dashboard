import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";
import SessionsActions from "@/components/SessionsActions";
import { getClient } from "../_actions/data-serves";

export default async function page() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  const user_id = data?.claims?.sub;

  const client = await getClient(user_id);

  return (
    <div className="">
      <SessionsActions client={client} />
    </div>
  );
}
