import React, { useState, useRef } from "react";

function PostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [platforms, setPlatforms] = useState({ facebook: false, topcv: false, linkedin: false });
  const [schedule, setSchedule] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState("");
  const titleMax = 80;
  const contentMax = 1000;
  const fileInputRef = useRef(null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/jpg", "image/avif"];
    if (!allowed.includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;
    setImage(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const targets = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k);
    if (targets.length === 0) return;
    setIsPosting(true);
    try {
      for (const platform of targets) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        if (image) formData.append("image", image);
        formData.append("platform", platform);
        formData.append("schedule", schedule);
        await fetch("http://localhost:5000/api/post", { method: "POST", body: formData });
      }
      setTitle("");
      setContent("");
      setImage(null);
      setPlatforms({ facebook: false, topcv: false, linkedin: false });
      setSchedule("");
      setNotice("Đã gửi yêu cầu đăng bài");
    } finally {
      setIsPosting(false);
    }
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0 && (platforms.facebook || platforms.topcv || platforms.linkedin);

  return (
    <div className="min-h-[85vh] bg-gradient-to-br from-blue-100 to-purple-100 flex justify-center py-8 px-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text [-webkit-text-fill-color:transparent]">Đăng bài tự động</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-white shadow-xl border rounded-3xl">
            <div className="card-body">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Tiêu đề</span>
                  </label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className="input input-bordered w-full" placeholder="Nhập tiêu đề" />
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-gray-500">{title.length}/{titleMax}</span>
                    <progress className="progress progress-primary w-full" value={title.length} max={titleMax}></progress>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nội dung</span>
                  </label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="textarea textarea-bordered w-full" placeholder="Nhập nội dung bài đăng" />
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-gray-500">{content.length}/{contentMax}</span>
                    <progress className="progress progress-secondary w-full" value={content.length} max={contentMax}></progress>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Ảnh đính kèm</span>
                  </label>
                  <div
                    onDragEnter={() => setDragActive(true)}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) { const allowed = ["image/jpeg","image/png","image/gif","image/jpg","image/avif"]; if (!allowed.includes(f.type)) return; if (f.size > 2*1024*1024) return; setImage(f);} }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                  >
                    <p className="text-sm text-gray-600">Kéo thả ảnh vào đây hoặc chọn từ máy</p>
                    <div className="mt-3">
                      <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>Chọn ảnh</button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                    </div>
                    {image ? (
                      <div className="mt-4">
                        <img src={URL.createObjectURL(image)} alt="preview" className="max-h-48 rounded-xl border" />
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nền tảng</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setPlatforms((p) => ({ ...p, facebook: !p.facebook }))} className={`btn ${platforms.facebook ? "btn-primary" : "btn-outline"}`}>Facebook</button>
                    <button type="button" onClick={() => setPlatforms((p) => ({ ...p, topcv: !p.topcv }))} className={`btn ${platforms.topcv ? "btn-primary" : "btn-outline"}`}>TopCV</button>
                    <button type="button" onClick={() => setPlatforms((p) => ({ ...p, linkedin: !p.linkedin }))} className={`btn ${platforms.linkedin ? "btn-info" : "btn-outline"}`}>LinkedIn</button>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Lịch đăng (tùy chọn)</span>
                  </label>
                  <input value={schedule} onChange={(e) => setSchedule(e.target.value)} type="datetime-local" className="input input-bordered w-full" />
                </div>
                <button type="submit" disabled={isPosting || !isValid} className="btn btn-primary w-full">
                  {isPosting ? "Đang gửi..." : "Đăng bài"}
                </button>
                {notice ? (
                  <div className="alert alert-success mt-3">
                    <span>{notice}</span>
                  </div>
                ) : null}
              </form>
            </div>
          </div>
          <div className="card bg-white shadow-xl border rounded-3xl">
            <div className="card-body">
              <h2 className="card-title">Xem trước</h2>
              <div className="space-y-3">
                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-500">Nền tảng</p>
                  <div className="mt-2 flex gap-2">
                    {platforms.facebook ? <span className="badge badge-primary">Facebook</span> : null}
                    {platforms.topcv ? <span className="badge badge-secondary">TopCV</span> : null}
                    {platforms.linkedin ? <span className="badge badge-info">LinkedIn</span> : null}
                    {!platforms.facebook && !platforms.topcv && !platforms.linkedin ? <span className="badge">Chưa chọn</span> : null}
                  </div>
                </div>
                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-500">Thời gian</p>
                  <p className="mt-1 font-medium">{schedule ? new Date(schedule).toLocaleString() : "Ngay khi gửi"}</p>
                </div>
                <div className="border rounded-xl p-4">
                  <h3 className="text-lg font-bold">{title || "Tiêu đề bài đăng"}</h3>
                  <p className="mt-2 whitespace-pre-line">{content || "Nội dung sẽ hiển thị tại đây"}</p>
                  {image ? <img src={URL.createObjectURL(image)} alt="preview" className="mt-3 rounded-xl border" /> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostPage;