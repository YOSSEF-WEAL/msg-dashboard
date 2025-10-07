"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClient } from "@/app/store/features/userSlice";

export function useLoadClient() {
  const dispatch = useDispatch();
  const client = useSelector((state) => state.user.client);
  const isLoading = useSelector((state) => state.user.isLoading);

  useEffect(() => {
    if (!client && !isLoading) {
      dispatch(fetchClient());
    }
  }, [client, isLoading, dispatch]);
}
