"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { RecommendationDialog, RecommendationItemResponse } from "@/components/movie/components/RecommendationDialog";
import { apiFetch } from "@/lib/fetchApi";

export function RecommendationPopup() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationItemResponse[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check if we already showed it in this session to avoid spamming the user
    const hasShown = sessionStorage.getItem("hasShownRecommendation_v2");
    if (hasShown) return;

    // Fetch recommendations
    const fetchRecommendations = async () => {
      try {
        const res = await apiFetch("/api-proxy/recommendations");
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && data.result && data.result.length > 0) {
            setRecommendations(data.result);
            setOpen(true);
            sessionStorage.setItem("hasShownRecommendation_v2", "true");
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      }
    };

    // Small delay so it doesn't pop up too aggressively on page load
    const timer = setTimeout(fetchRecommendations, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  if (recommendations.length === 0) return null;

  return (
    <RecommendationDialog 
      open={open} 
      onOpenChange={setOpen} 
      recommendations={recommendations} 
    />
  );
}
