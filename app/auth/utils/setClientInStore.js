"use client";
import { store } from "@/app/store/store";
import { setClient, clearClient } from "@/app/store/features/userSlice";
import { getClient } from "@/app/_actions/data-serves";

export async function initializeClientStore(user_id) {
  try {
    if (!user_id) return;

    const client = await getClient(user_id);
    if (client) {
      store.dispatch(setClient(client));
      console.log("✅ Client loaded into Redux:", client.name);
    } else {
      console.warn("⚠️ No client data found for this user.");
    }
  } catch (error) {
    console.error("❌ Error loading client into store:", error);
  }
}

export function clearClientStore() {
  store.dispatch(clearClient());
}
