"use client";

import { useCallback, useEffect, useState } from "react";
import { isAdminUser } from "@/lib/admin";
import { BRAND } from "@/lib/brand";
import {
  deleteCommunityPost,
  fetchCommunityPosts,
  postCommunityMessage,
  postNotice,
  setPostPinned,
  type CommunityPost,
} from "@/lib/community";
import type { UserProfile } from "@/lib/user";
import { SectionHeading } from "@/components/ui";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommunityPanel({
  profile,
  userEmail,
  signedIn,
}: {
  profile: UserProfile;
  userEmail: string | null;
  signedIn: boolean;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [busy, setBusy] = useState(false);

  const isAdmin = isAdminUser(profile, userEmail);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await fetchCommunityPosts();
    setPosts(result.posts);
    setError(result.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (signedIn) void reload();
    else setLoading(false);
  }, [signedIn, reload]);

  const notices = posts.filter((p) => p.postType === "notice");
  const messages = posts.filter((p) => p.postType === "community");

  const submitMessage = async () => {
    setBusy(true);
    setError(null);
    const result = await postCommunityMessage(messageBody, profile.id, profile.firstName);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessageBody("");
    await reload();
  };

  const submitNotice = async () => {
    setBusy(true);
    setError(null);
    const result = await postNotice(noticeTitle, noticeBody, profile.id, profile.firstName);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNoticeTitle("");
    setNoticeBody("");
    await reload();
  };

  const togglePin = async (post: CommunityPost) => {
    setBusy(true);
    setError(null);
    const result = await setPostPinned(post.id, !post.pinned);
    setBusy(false);
    if (result.error) setError(result.error);
    else await reload();
  };

  const removePost = async (postId: string) => {
    if (!window.confirm("Remove this post?")) return;
    setBusy(true);
    const result = await deleteCommunityPost(postId);
    setBusy(false);
    if (result.error) setError(result.error);
    else await reload();
  };

  if (!signedIn) {
    return (
      <div className="screen community-screen">
        <header className="topbar community-topbar">
          <div>
            <span className="eyebrow">6-week challenge</span>
            <h1 className="community-title">Community</h1>
          </div>
        </header>
        <article className="card">
          <p className="coach-message">
            Sign in to join the {BRAND.name} challenge community — notice board, updates, and messages with other
            members.
          </p>
        </article>
      </div>
    );
  }

  return (
    <div className="screen community-screen">
      <header className="topbar community-topbar">
        <div>
          <span className="eyebrow">6-week challenge</span>
          <h1 className="community-title">Community</h1>
        </div>
      </header>

      {error ? <p className="community-error">{error}</p> : null}

      <SectionHeading eyebrow="Notice board" title="Updates from your coach" />
      {loading ? (
        <p className="muted">Loading…</p>
      ) : notices.length === 0 ? (
        <article className="card community-empty">
          <p className="muted">No notices yet — check back for challenge updates.</p>
        </article>
      ) : (
        <div className="community-list">
          {notices.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAdmin={isAdmin}
              canDelete={isAdmin || post.authorId === profile.id}
              busy={busy}
              onPin={() => togglePin(post)}
              onDelete={() => removePost(post.id)}
            />
          ))}
        </div>
      )}

      {isAdmin ? (
        <article className="card community-compose">
          <span className="eyebrow">Coach · new notice</span>
          <label className="field">
            <span>Title (optional)</span>
            <input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="Week 1 kick-off" />
          </label>
          <label className="field">
            <span>Notice</span>
            <textarea
              className="community-textarea"
              value={noticeBody}
              onChange={(e) => setNoticeBody(e.target.value)}
              placeholder="Welcome to the 6-week challenge…"
              rows={4}
            />
          </label>
          <button type="button" className="cta-btn" disabled={busy || !noticeBody.trim()} onClick={() => void submitNotice()}>
            Post notice
          </button>
        </article>
      ) : null}

      <SectionHeading eyebrow="Messages" title="Community chat" />
      <article className="card community-compose">
        <label className="field">
          <span>Your message</span>
          <textarea
            className="community-textarea"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Share a win, ask a question, encourage someone…"
            rows={3}
          />
        </label>
        <button type="button" className="cta-btn" disabled={busy || !messageBody.trim()} onClick={() => void submitMessage()}>
          Post message
        </button>
      </article>

      {loading ? (
        <p className="muted">Loading messages…</p>
      ) : messages.length === 0 ? (
        <article className="card community-empty">
          <p className="muted">Be the first to say hello to the group.</p>
        </article>
      ) : (
        <div className="community-list">
          {messages.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAdmin={isAdmin}
              canDelete={isAdmin || post.authorId === profile.id}
              busy={busy}
              onPin={() => togglePin(post)}
              onDelete={() => removePost(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  isAdmin,
  canDelete,
  busy,
  onPin,
  onDelete,
}: {
  post: CommunityPost;
  isAdmin: boolean;
  canDelete: boolean;
  busy: boolean;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={`card community-post${post.pinned ? " is-pinned" : ""}`}>
      <div className="community-post-head">
        <div>
          {post.pinned ? <span className="community-pin-badge">Pinned</span> : null}
          {post.title ? <strong className="community-post-title">{post.title}</strong> : null}
          <span className="community-meta">
            {post.authorName} · {formatWhen(post.createdAt)}
          </span>
        </div>
        <div className="community-post-actions">
          {isAdmin ? (
            <button type="button" className="ghost-btn community-action" disabled={busy} onClick={onPin}>
              {post.pinned ? "Unpin" : "Pin"}
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" className="ghost-btn community-action" disabled={busy} onClick={onDelete}>
              Delete
            </button>
          ) : null}
        </div>
      </div>
      <p className="community-post-body">{post.body}</p>
    </article>
  );
}
