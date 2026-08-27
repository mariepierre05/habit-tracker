// An installed PWA on iOS can't complete an <a download>; the share sheet is
// the reliable way to hand the user a file there (Save to Files, Mail, open in
// Calendar…). Everywhere else falls back to a normal download.
// Returns "shared" | "downloaded" | "cancelled".
export async function shareOrDownload(text, filename, mime) {
  try {
    const file = new File([text], filename, { type: mime });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    }
  } catch (err) {
    // The user dismissing the share sheet is not an error worth reporting.
    if (err && err.name === "AbortError") return "cancelled";
  }

  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "downloaded";
}
