import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather last 7 days of data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const [activitiesRes, moodsRes, reflectionsRes, goalsRes, profileRes] = await Promise.all([
      supabase.from("activities").select("*").eq("user_id", user.id).gte("date", weekAgoStr).order("date"),
      supabase.from("moods").select("*").eq("user_id", user.id).gte("date", weekAgoStr).order("date"),
      supabase.from("reflections").select("*").eq("user_id", user.id).gte("date", weekAgoStr).order("created_at"),
      supabase.from("goals").select("*").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);

    const activities = activitiesRes.data || [];
    const moods = moodsRes.data || [];
    const reflections = reflectionsRes.data || [];
    const goals = goalsRes.data || [];
    const profile = profileRes.data;

    // Build summary data for the AI
    const activitySummary = activities.reduce((acc: Record<string, number>, a: any) => {
      acc[a.action_type] = (acc[a.action_type] || 0) + 1;
      return acc;
    }, {});

    const moodSummary = moods.reduce((acc: Record<string, number>, m: any) => {
      acc[m.mood] = (acc[m.mood] || 0) + 1;
      return acc;
    }, {});

    const reflectionTexts = reflections.slice(0, 5).map((r: any) =>
      `"${r.reflection_text.substring(0, 150)}" (mood: ${r.mood || "not set"}, ayah: ${r.ayah_reference || "none"})`
    );

    const goalSummary = goals.map((g: any) =>
      `${g.title}: ${g.progress}/${g.target_value} (${g.completed ? "completed" : "in progress"})`
    );

    const activeDays = new Set(activities.map((a: any) => a.date)).size;

    const dataPrompt = `
User: ${profile?.full_name || "User"}
Current streak: ${profile?.current_streak || 0} days
Active days this week: ${activeDays}/7

Activity breakdown this week:
${Object.entries(activitySummary).map(([k, v]) => `- ${k}: ${v} times`).join("\n") || "- No activities recorded"}

Mood check-ins this week:
${Object.entries(moodSummary).map(([k, v]) => `- ${k}: ${v} times`).join("\n") || "- No mood check-ins"}

Recent reflections:
${reflectionTexts.length > 0 ? reflectionTexts.join("\n") : "- No reflections written"}

Goals:
${goalSummary.length > 0 ? goalSummary.join("\n") : "- No goals set"}
`.trim();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are QuranFlow AI's Weekly Spiritual Report generator. Generate a warm, personalized weekly spiritual report in markdown format.

Structure your report EXACTLY like this:

# 🌙 Your Weekly Spiritual Report

## 📊 Week at a Glance
A brief 2-3 sentence overview of their engagement level.

## 💖 Mood Patterns
Analyze their mood trends. What emotions were most present? Any shifts throughout the week? Keep it compassionate.

## 📖 Reflection Highlights
Comment on their reflections — themes, depth of thought, growth areas. If they wrote about specific ayahs, acknowledge that.

## 🎯 Goal Progress
How are they doing on their goals? Celebrate wins, gently encourage where needed.

## ✨ Spiritual Insight of the Week
Share one relevant Qur'anic verse with its reference that connects to their week's journey. Explain why it's meaningful for them specifically.

## 🗓️ Suggestions for Next Week
Give 3-4 specific, actionable suggestions based on their data. Be practical and encouraging.

## 💬 Personal Note
End with a warm, personal 2-3 sentence encouragement. Reference something specific from their week.

Rules:
- Be warm, genuine, and specific — not generic
- Reference their actual data (moods, reflections, activities)
- Include Qur'anic references naturally
- Keep the tone uplifting, never guilt-inducing
- If they had low engagement, be encouraging not critical
- Total length: 400-600 words`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate my weekly spiritual report based on this data:\n\n${dataPrompt}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Unable to generate report. Please try again.";

    return new Response(JSON.stringify({
      report: content,
      metadata: {
        activeDays,
        totalActivities: activities.length,
        totalReflections: reflections.length,
        totalMoodCheckins: moods.length,
        dominantMood: Object.entries(moodSummary).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || null,
        streak: profile?.current_streak || 0,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Weekly report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
