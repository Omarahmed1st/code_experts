// URLs for lesson images. R2 keys look like courses/<course_id>/lessons/<lesson_id>/<file>;
// the public URL leaves the course id out (the course slug is already in the path)
// and the media route puts it back from the CourseScope, so a URL can only ever
// reach its own course's folder.

const FILE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;
const ID = /^[a-z]+_[a-f0-9]{8,32}$/;

export function lessonImageUrl(courseSlug: string, courseId: string, key: string): string | null {
  const prefix = `courses/${courseId}/lessons/`;
  if (!key.startsWith(prefix)) return null;
  const [lessonId, file, ...rest] = key.slice(prefix.length).split("/");
  if (!lessonId || !file || rest.length > 0) return null;
  return `/courses/${courseSlug}/media/${encodeURIComponent(lessonId)}/${encodeURIComponent(file)}`;
}

/** The R2 key for a media URL's parts, or null if they don't look like ours. */
export function lessonImageKey(courseId: string, lessonId: string, file: string): string | null {
  if (!ID.test(lessonId) || !FILE.test(file) || file.includes("..")) return null;
  return `courses/${courseId}/lessons/${lessonId}/${file}`;
}

export function fileNameOf(key: string): string {
  return key.slice(key.lastIndexOf("/") + 1);
}
