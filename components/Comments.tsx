"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { moderateComment } from "@/lib/domain";
import { listCommentDislikeCounts } from "@/lib/comment-reactions";
import { createComment, dislikeComment, isSupabaseConfigured, listComments, reportComment, voteComment } from "@/lib/supabase-rest";
import { useAuth } from "./AuthProvider";

export type DisplayComment = { id: string; name: string; time: string; text: string; likes: number; dislikes: number };

function ThumbUpIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 10h9.1a3 3 0 0 0 2.86-2.1l1.68-5.4A2 2 0 0 0 18.73 10H14l.72-3.57A2.85 2.85 0 0 0 12.8 3.2L12 3l-5 7v10Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}

function ThumbDownIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14V4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3Zm0-10h9.1a3 3 0 0 1 2.86 2.1l1.68 5.4A2 2 0 0 1 18.73 14H14l.72 3.57a2.85 2.85 0 0 1-1.92 3.23L12 21l-5-7V4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M12 10.5v6M12 7.5h.01" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>;
}

export function Comments({ ipoId }: { ipoId: string; slug: string }) {
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { session } = useAuth();
  const remaining = useMemo(() => 500 - draft.length, [draft]);

  async function load() {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    try {
      const rows = await listComments(ipoId, session?.access_token);
      const ids = rows.map((row) => String(row.id));
      const dislikeCounts = await listCommentDislikeCounts(ids, session?.access_token);
      setComments(rows.map((row) => ({
        id: String(row.id),
        name: String(row.display_name || "Üye"),
        time: new Date(String(row.created_at)).toLocaleString("tr-TR"),
        text: String(row.body),
        likes: Number(row.helpful_count || 0),
        dislikes: Number(dislikeCounts[String(row.id)] || 0)
      })));
    } catch {
      setMessage("Yorumlar şu anda alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [ipoId, session]);

  async function submitComment() {
    const result = moderateComment(draft);
    if (!result.allowed) { setMessage(result.reason || "Yorum yayımlanamadı."); return; }
    if (!session) { setMessage("Yorum yapmak için giriş yapmalısın."); return; }
    try {
      await createComment({ ipoId, body: draft.trim(), token: session.access_token });
      setDraft("");
      setMessage("Yorumun yayımlandı.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Yorum kaydedilemedi.");
    }
  }

  async function like(id: string) {
    if (!session) { setMessage("Yorumu beğenmek için giriş yapmalısın."); return; }
    setBusyId(id);
    try {
      await voteComment(id, session.access_token);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Beğeni kaydedilemedi.");
    } finally {
      setBusyId(null);
    }
  }

  async function dislike(id: string) {
    if (!session) { setMessage("Yoruma tepki vermek için giriş yapmalısın."); return; }
    setBusyId(id);
    try {
      await dislikeComment(id, session.access_token);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tepki kaydedilemedi.");
    } finally {
      setBusyId(null);
    }
  }

  async function report(id: string) {
    if (!session) { setMessage("Yorumu bildirmek için giriş yapmalısın."); return; }
    const details = window.prompt("Bildirim nedenini kısaca yaz (isteğe bağlı):", "") || "";
    setBusyId(id);
    try {
      await reportComment(id, "other", details, session.access_token);
      setMessage("Bildirim moderasyon ekibine iletildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bildirim gönderilemedi.");
    } finally {
      setBusyId(null);
    }
  }

  return <section className="commentsPanel" id="yorumlar">
    <div className="sectionHeading compactHeading">
      <div><span className="eyebrow">Topluluk</span><h2>Yatırımcı yorumları</h2></div>
      <span className="commentCount">{comments.length} yorum</span>
    </div>

    <div className="commentComposer">
      <textarea maxLength={500} value={draft} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setDraft(e.target.value); setMessage(""); }} placeholder="Görüşünü paylaş…" aria-label="Yorum" disabled={!isSupabaseConfigured()} />
      <div className="composerFooter"><small>{remaining} karakter</small><button className="primaryButton" onClick={() => void submitComment()} disabled={!isSupabaseConfigured() || !draft.trim()}>Yorum yap</button></div>
    </div>

    <div className="commentPolicyCard">
      <div className="commentPolicyIcon"><InfoIcon /></div>
      <div>
        <p><strong>Yorumlar kullanıcı görüşüdür.</strong> HalkaArzım görüşü veya yatırım tavsiyesi değildir. İçerikten yorumu paylaşan kullanıcı sorumludur. Kötüye kullanım ve hukuki talepler için sınırlı teknik erişim kayıtları tutulabilir.</p>
        <p>Kesin kazanç vaadi, organize alım çağrısı, iletişim grubu reklamı, kişisel veri ve hakaret otomatik olarak engellenir. Bildirilen içerikler sonradan incelenebilir.</p>
      </div>
    </div>

    {!isSupabaseConfigured() && <p className="formMessage">Yorum alanı şu anda salt okunur.</p>}
    {message && <p className="formMessage" role="status">{message}</p>}

    {loading ? <p className="commentsLoading">Yorumlar yükleniyor…</p> : <div className="commentList">
      {comments.map((comment) => <article className="comment" key={comment.id}>
        <div className="avatar">{comment.name.charAt(0).toUpperCase()}</div>
        <div className="commentBody">
          <div className="commentMeta"><strong>{comment.name}</strong><span>{comment.time}</span></div>
          <p>{comment.text}</p>
          <div className="commentActions">
            <button className="reactionButton" type="button" aria-label={`Beğen, ${comment.likes}`} disabled={busyId === comment.id} onClick={() => void like(comment.id)}><ThumbUpIcon /><span>{comment.likes}</span></button>
            <button className="reactionButton" type="button" aria-label={`Beğenmedim, ${comment.dislikes}`} disabled={busyId === comment.id} onClick={() => void dislike(comment.id)}><ThumbDownIcon /><span>{comment.dislikes}</span></button>
            <span className="actionDivider" aria-hidden="true" />
            <button className="reportButton" type="button" disabled={busyId === comment.id} onClick={() => void report(comment.id)}>Bildir</button>
          </div>
        </div>
      </article>)}
      {!comments.length && <div className="emptyState"><strong>Henüz yorum yok</strong><p>İlk görüşü sen paylaşabilirsin.</p></div>}
      {!!comments.length && <p className="commentsEnd">Tüm yorumlar yüklendi.</p>}
    </div>}
  </section>;
}
