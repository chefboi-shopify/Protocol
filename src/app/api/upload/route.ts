import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { uploadVideo } from "@/lib/storage";

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["video/webm", "video/mp4", "video/quicktime"];

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await req.formData();
  const video = formData.get("video") as File;
  if (!video) {
    return NextResponse.json({ error: "NO_VIDEO" }, { status: 400 });
  }

  if (video.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE", max: "50MB" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(video.type) && video.type !== "") {
    return NextResponse.json({ error: "INVALID_TYPE", allowed: ALLOWED_TYPES }, { status: 400 });
  }

  try {
    const url = await uploadVideo(userId, video);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}
