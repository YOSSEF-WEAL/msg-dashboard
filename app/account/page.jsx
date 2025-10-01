import { getClientWithDetails } from "@/app/_actions/data-serves";
import AccountForm from "@/components/AccountForm";
import { createClient } from "@/lib/server";

export default async function AccountPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const client = await getClientWithDetails(data?.claims?.sub);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-600">
          Manage your account information and permissions
        </p>
      </div>

      <AccountForm client={client} />
    </div>
  );
}
