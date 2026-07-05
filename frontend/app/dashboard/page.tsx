"use client";

import { useAppAuth } from "@/hooks/useAppAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User, Video as VideoIcon, Plus, Play, Loader2, Upload, AlertCircle } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";

interface VideoRecord {
  id: number;
  title: string;
  storage_cid: string;
  livepeer_playback_id: string | null;
  is_active: boolean;
}

export default function DashboardPage() {
  const { ready, authenticated, logout, user } = useAppAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  
  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newPlaybackId, setNewPlaybackId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Fetch catalog from backend API
  const fetchCatalog = async () => {
    try {
      setLoadingVideos(true);
      const res = await fetch("http://127.0.0.1:8000/api/media/catalog");
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (e) {
      console.error("Error fetching video catalog:", e);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchCatalog();
    }
  }, [authenticated]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRegisterVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedFile) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      setUploadProgress("Uploading file to decentralized storage...");

      // 1. Upload file to our server-side proxy endpoint
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      const storageCid = uploadData.storage_cid;

      setUploadProgress("Registering metadata on backend...");

      // 2. Ping backend database to save metadata record
      const registerRes = await fetch("http://127.0.0.1:8000/api/media/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          storage_cid: storageCid,
          livepeer_playback_id: newPlaybackId || null,
        }),
      });

      if (!registerRes.ok) {
        throw new Error("Failed to register metadata on backend.");
      }

      // Success cleanup
      setNewTitle("");
      setSelectedFile(null);
      setNewPlaybackId("");
      setShowModal(false);
      setUploadProgress("");
      fetchCatalog();
    } catch (e: any) {
      console.error("Error during upload/registration:", e);
      setErrorMsg(e.message || "An unexpected error occurred.");
      setUploadProgress("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Get user identifier
  const walletAddress = user?.wallet?.address;
  const truncatedWallet = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Connected User";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              StreamHub
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-300">
              <User className="h-4 w-4 text-blue-400" />
              <span>{truncatedWallet}</span>
            </div>

            <button
              onClick={logout}
              className="flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Active Video Player Hero */}
          {selectedVideo && (
            <div className="mb-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 backdrop-blur-md animate-in fade-in duration-200">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    Now Streaming: {selectedVideo.title}
                  </h2>
                  <button 
                    onClick={() => setSelectedVideo(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Close Player
                  </button>
                </div>
                <VideoPlayer
                  src={selectedVideo.livepeer_playback_id
                    ? `https://livepeercdn.com/hls/${selectedVideo.livepeer_playback_id}/index.m3u8`
                    : `https://ipfs.io/ipfs/${selectedVideo.storage_cid}`}
                />
                
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500 border-t border-zinc-850 pt-4">
                  <span>Storage CID: <span className="font-mono text-zinc-300 select-all">{selectedVideo.storage_cid}</span></span>
                  {selectedVideo.livepeer_playback_id && (
                    <span>Livepeer Playback ID: <span className="font-mono text-zinc-300 select-all">{selectedVideo.livepeer_playback_id}</span></span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Decentralized Catalog
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Explore and stream decentralized media from IPFS and Livepeer network
              </p>
            </div>

            <button
              onClick={() => {
                setErrorMsg("");
                setUploadProgress("");
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Plus className="h-4 w-4" />
              Upload & Register Video
            </button>
          </div>

          {/* Videos Grid */}
          <div className="mt-10">
            {loadingVideos ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-20 text-center">
                <VideoIcon className="h-12 w-12 text-zinc-600" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-300">No media registered</h3>
                <p className="mt-1 text-sm text-zinc-500 max-w-xs">
                  Get started by registering a new video storage CID and Livepeer playback ID.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Video
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => setSelectedVideo(vid)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                        <VideoIcon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-zinc-100 truncate group-hover:text-white">
                        {vid.title}
                      </h3>
                    </div>

                    <div className="mt-4 space-y-2.5 text-xs text-zinc-400">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Storage CID:</span>
                        <span className="font-mono text-zinc-300 max-w-[180px] truncate" title={vid.storage_cid}>
                          {vid.storage_cid}
                        </span>
                      </div>
                      {vid.livepeer_playback_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Livepeer ID:</span>
                          <span className="font-mono text-zinc-300 truncate">
                            {vid.livepeer_playback_id}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-2xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                        Active
                      </span>

                      <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all">
                        <Play className="h-3 w-3 fill-current" />
                        Stream
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload & Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" />
              Upload & Register Video
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Upload local files directly to IPFS (via Pinata) and save metadata to the catalog.
            </p>

            <form onSubmit={handleRegisterVideo} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Movie Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Big Buck Bunny"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-650 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Select Local Video File *</label>
                <input
                  type="file"
                  required
                  accept="video/*"
                  onChange={handleFileChange}
                  className="mt-1.5 block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Livepeer Playback ID (Optional)</label>
                <input
                  type="text"
                  value={newPlaybackId}
                  onChange={(e) => setNewPlaybackId(e.target.value)}
                  placeholder="For high-quality adaptive streaming"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-650 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Status and Error Banners */}
              {uploadProgress && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-xs text-blue-400 border border-blue-500/20">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "Upload & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
