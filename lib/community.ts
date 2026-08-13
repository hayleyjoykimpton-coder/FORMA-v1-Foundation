/**
 * Life & Soul community — notice board + challenge messages (Supabase).
 */

import { getSessionUserId } from "./sync";
import { getSupabase } from "./supabase";

export type CommunityPostType = "notice" | "community";

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  title: string | null;
  body: string;
  postType: CommunityPostType;
  pinned: boolean;
  pinOrder: number | null;
  createdAt: string;
};

type Row = {
  id: string;
  author_id: string;
  author_name: string;
  title: string | null;
  body: string;
  post_type: CommunityPostType;
  pinned: boolean;
  pin_order: number | null;
  created_at: string;
};

function rowToPost(row: Row): CommunityPost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    postType: row.post_type,
    pinned: row.pinned,
    pinOrder: row.pin_order,
    createdAt: row.created_at,
  };
}

function sortPosts(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const ao = a.pinOrder ?? 9999;
    const bo = b.pinOrder ?? 9999;
    if (ao !== bo) return ao - bo;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/** True when Supabase hasn't had the community migration applied yet. */
export function isCommunitySetupError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("community_posts") &&
    (lower.includes("could not find") ||
      lower.includes("does not exist") ||
      lower.includes("schema cache") ||
      lower.includes("relation") ||
      lower.includes("pgrst205"))
  );
}

export function communitySetupMessage(): string {
  return "Notice board isn't set up yet. In Supabase → SQL Editor, run supabase/community_migration.sql, then refresh this page.";
}

function mapCommunityError(message: string): string {
  if (isCommunitySetupError(message)) return communitySetupMessage();
  if (message.includes("row-level security")) {
    return "Permission denied — coach accounts need is_admin = true in Supabase profiles.";
  }
  return message;
}

async function requireAuthor(): Promise<{ userId: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };
  const userId = await getSessionUserId();
  if (!userId) return { error: "Sign in to post or read messages." };
  return { userId };
}

export async function fetchCommunityPosts(): Promise<{ posts: CommunityPost[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { posts: [], error: "Community requires cloud sign-in." };

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { posts: [], error: mapCommunityError(error.message) };
  return { posts: sortPosts((data as Row[]).map(rowToPost)) };
}

export async function postCommunityMessage(
  body: string,
  authorName: string,
): Promise<{ error?: string }> {
  const auth = await requireAuthor();
  if ("error" in auth) return { error: auth.error };

  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Write a message first." };

  const { error } = await supabase.from("community_posts").insert({
    author_id: auth.userId,
    author_name: authorName.trim() || "Member",
    body: trimmed,
    post_type: "community",
  });

  return error ? { error: mapCommunityError(error.message) } : {};
}

export async function postNotice(
  title: string,
  body: string,
  authorName: string,
): Promise<{ error?: string }> {
  const auth = await requireAuthor();
  if ("error" in auth) return { error: auth.error };

  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };

  const trimmedBody = body.trim();
  if (!trimmedBody) return { error: "Add notice text." };

  const { error } = await supabase.from("community_posts").insert({
    author_id: auth.userId,
    author_name: authorName.trim() || "Coach",
    title: title.trim() || null,
    body: trimmedBody,
    post_type: "notice",
  });

  return error ? { error: mapCommunityError(error.message) } : {};
}

export async function setPostPinned(
  postId: string,
  pinned: boolean,
  pinOrder?: number | null,
): Promise<{ error?: string }> {
  const auth = await requireAuthor();
  if ("error" in auth) return { error: auth.error };

  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };

  const { error } = await supabase
    .from("community_posts")
    .update({
      pinned,
      pin_order: pinned ? (pinOrder ?? 0) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  return error ? { error: mapCommunityError(error.message) } : {};
}

export async function deleteCommunityPost(postId: string): Promise<{ error?: string }> {
  const auth = await requireAuthor();
  if ("error" in auth) return { error: auth.error };

  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };

  const { error } = await supabase.from("community_posts").delete().eq("id", postId);
  return error ? { error: mapCommunityError(error.message) } : {};
}

/** Subscribe to live updates on the notice board (requires Realtime enabled on the table). */
export function subscribeCommunityPosts(onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel("community_posts_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_posts" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
