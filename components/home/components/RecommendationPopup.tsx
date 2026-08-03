"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { RecommendationDialog, RecommendationItemResponse, GenreProfileItem } from "@/components/movie/components/RecommendationDialog";
import { apiFetch } from "@/lib/fetchApi";

export function RecommendationPopup() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationItemResponse[]>([]);
  const [genreProfile, setGenreProfile] = useState<GenreProfileItem[]>([]);
  const [usedColdStart, setUsedColdStart] = useState(false);
  const [recommendationUserId, setRecommendationUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId) {
      const resetTimer = window.setTimeout(() => {
        setOpen(false);
        setRecommendations([]);
        setGenreProfile([]);
        setUsedColdStart(false);
        setRecommendationUserId(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    if (recommendationUserId && recommendationUserId !== user.userId) {
      const resetTimer = window.setTimeout(() => {
        setOpen(false);
        setRecommendations([]);
        setGenreProfile([]);
        setUsedColdStart(false);
        setRecommendationUserId(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    // Check if we already showed it in this session to avoid spamming the user
    const hasShownKey = `hasShownRecommendation_v2:${user.userId}`;
    const hasShown = sessionStorage.getItem(hasShownKey);
    if (hasShown) return;

    // Fetch recommendations
    const fetchRecommendations = async () => {
      try {
        const res = await apiFetch("/api-proxy/recommendations");
        if (res.ok) {
          const data = await res.json();
          const result = data.result;
          if (data.code === 0 && result && result.recommendations && result.recommendations.length > 0) {
            setRecommendations(result.recommendations);
            setGenreProfile(result.genreProfile ?? []);
            setUsedColdStart(!!result.usedColdStart);
            setRecommendationUserId(user.userId);
            setOpen(true);
            sessionStorage.setItem(hasShownKey, "true");
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      }
    };

    // Small delay so it doesn't pop up too aggressively on page load
    const timer = setTimeout(fetchRecommendations, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.userId, recommendationUserId]);

  if (recommendations.length === 0 || recommendationUserId !== user?.userId) return null;

  return (
    <RecommendationDialog
      open={open}
      onOpenChange={setOpen}
      recommendations={recommendations}
      genreProfile={genreProfile}
      usedColdStart={usedColdStart}
    />
  );
}
