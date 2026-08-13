/**
 * Life & Soul community — notice board + challenge messages (Supabase).
 */

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

export async function fetchCommunityPosts(): Promise<{ posts: CommunityPost[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { posts: [], error: "Community requires cloud sign-in." };

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { posts: [], error: error.message };
  return { posts: sortPosts((data as Row[]).map(rowToPost)) };
}

export async function postCommunityMessage(
  body: string,
  authorId: string,
  authorName: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write a message first." };

  const { error } = await supabase.from("community_posts").insert({
    author_id: authorId,
    author_name: authorName.trim() || "Member",
    body: trimmed,
    post_type: "community",
  });

  return error ? { error: error.message } : {};
}

export async function postNotice(
  title: string,
  body: string,
  authorId: string,
  authorName: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };
  const trimmedBody = body.trim();
  if (!trimmedBody) return { error: "Add notice text." };

  const { error } = await supabase.from("community_posts").insert({
    author_id: authorId,
    author_name: authorName.trim() || "Coach",
    title: title.trim() || null,
    body: trimmedBody,
    post_type: "notice",
  });

  return error ? { error: error.message } : {};
}

export async function setPostPinned(
  postId: string,
  pinned: boolean,
  pinOrder?: number | null,
): Promise<{ error?: string }> {
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

  return error ? { error: error.message } : {};
}

export async function deleteCommunityPost(postId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Community requires cloud sign-in." };

  const { error } = await supabase.from("community_posts").delete().eq("id", postId);
  return error ? { error: error.message } : {};
}
