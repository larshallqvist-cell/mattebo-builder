import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SurveyQuestionKey } from "@/lib/survey";

export interface WeeklySurvey {
  id: string;
  grade: number;
  week_start: string;
  is_open: boolean;
}

export type SurveyAnswers = Record<SurveyQuestionKey, number | null> & {
  learned_text: string;
  wish_text: string;
};

export const emptyAnswers = (): SurveyAnswers => ({
  q_learning: null,
  q_effort: null,
  q_calm: null,
  q_teacher: null,
  learned_text: "",
  wish_text: "",
});

/**
 * Loads the currently open weekly check-in for a grade plus the signed-in
 * student's response (if any). Used by the lamp in the header.
 */
export const useWeeklySurvey = (grade: number) => {
  const { user, accessStatus } = useAuth();
  const [survey, setSurvey] = useState<WeeklySurvey | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || accessStatus !== "approved") {
      setSurvey(null);
      setAnswers(null);
      setLoading(false);
      return;
    }

    const { data: surveyRow } = await supabase
      .from("weekly_surveys")
      .select("id, grade, week_start, is_open")
      .eq("grade", grade)
      .eq("is_open", true)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!surveyRow) {
      setSurvey(null);
      setAnswers(null);
      setLoading(false);
      return;
    }

    setSurvey(surveyRow as WeeklySurvey);

    const { data: responseRow } = await supabase
      .from("survey_responses")
      .select("q_learning, q_effort, q_calm, q_teacher, learned_text, wish_text")
      .eq("survey_id", surveyRow.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setAnswers(responseRow ? (responseRow as SurveyAnswers) : null);
    setLoading(false);
  }, [grade, user, accessStatus]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`weekly_surveys_${grade}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weekly_surveys", filter: `grade=eq.${grade}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [grade, load]);

  const submit = useCallback(
    async (next: SurveyAnswers) => {
      if (!survey || !user) throw new Error("Ingen avstämning är öppen just nu.");
      const { error } = await supabase.from("survey_responses").upsert(
        {
          survey_id: survey.id,
          user_id: user.id,
          q_learning: next.q_learning!,
          q_effort: next.q_effort!,
          q_calm: next.q_calm!,
          q_teacher: next.q_teacher!,
          learned_text: next.learned_text.trim(),
          wish_text: next.wish_text.trim(),
        },
        { onConflict: "survey_id,user_id" },
      );
      if (error) throw error;
      setAnswers(next);
    },
    [survey, user],
  );

  return {
    survey,
    answers,
    hasAnswered: answers !== null,
    isOpen: Boolean(survey),
    loading,
    submit,
    reload: load,
  };
};
