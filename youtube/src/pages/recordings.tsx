import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteRecording, listRecordings, RecordingEntry } from "@/lib/recordings";

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const RecordingsPage = () => {
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRecordings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listRecordings();
      setRecordings(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load recordings:", err);
      setError("Unable to load recordings on this browser.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const selected = recordings.find((rec) => rec.id === selectedId) || null;

  useEffect(() => {
    if (!selected?.blob) {
      setSelectedUrl(null);
      return;
    }
    const url = URL.createObjectURL(selected.blob);
    setSelectedUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selected?.id]);

  const handleDownload = (recording: RecordingEntry) => {
    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = recording.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await deleteRecording(id);
    await loadRecordings();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Call Recordings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Recordings are stored locally in this browser.
            </p>
          </div>
          <Link
            href="/friends"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Friends
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            Loading recordings...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : recordings.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            No recordings yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              {selected ? (
                <div>
                  <video
                    key={selected.id}
                    controls
                    className="w-full rounded-lg mb-4"
                    src={selectedUrl || undefined}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {selected.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(selected.createdAt).toLocaleString()} ·{" "}
                        {formatSize(selected.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(selected)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(selected.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 dark:text-gray-400">
                  Select a recording to preview.
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Recordings
              </h2>
              <div className="space-y-2">
                {recordings.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedId(rec.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedId === rec.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="text-sm font-medium">{rec.name}</div>
                    <div className="text-xs opacity-80">
                      {new Date(rec.createdAt).toLocaleDateString()} ·{" "}
                      {formatSize(rec.size)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingsPage;
