import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getClient } from "@/app/_actions/data-serves";
import { createClient } from "@/lib/client";

export const fetchClient = createAsyncThunk(
  "user/fetchClient",
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData?.user?.id) {
        return rejectWithValue("No user logged in");
      }

      const user_id = userData.user.id;
      const client = await getClient(user_id);

      if (!client) {
        return rejectWithValue("No client data found");
      }

      return client;
    } catch (err) {
      console.error("fetchClient error:", err);
      return rejectWithValue(err.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    client: null,
    role: null,
    plan: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setClient: (state, action) => {
      const client = action.payload;
      state.client = client;
      state.role = client?.roles || null;
      state.plan = client?.company_information?.plans || null;
    },
    clearClient: (state) => {
      state.client = null;
      state.role = null;
      state.plan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClient.fulfilled, (state, action) => {
        const client = action.payload;
        state.client = client;
        state.role = client?.roles || null;
        state.plan = client?.company_information?.plans || null;
        state.isLoading = false;
      })
      .addCase(fetchClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch client data";
      });
  },
});

export const { setClient, clearClient } = userSlice.actions;
export default userSlice.reducer;
