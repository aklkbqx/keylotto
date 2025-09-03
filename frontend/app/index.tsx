import React, { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/libs/providers/AuthProvider";

export default function Index() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuth();

  useEffect(() => {
    // Ensure we check auth on landing
    checkAuth();
  }, []);

  if (isLoading) return null;

  if (!isAuthenticated) return <Redirect href="/welcome" />;
  if (user?.role === "admin") {
    return <Redirect href="/admin/dashboard" />;
  } else if (user?.role === "user") {
    return <Redirect href="/user/home" />;
  } else {
    return <Redirect href="/welcome" />
  }
}
