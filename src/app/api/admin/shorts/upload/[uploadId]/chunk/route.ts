import { forwardStreamingPost } from "@/lib/shortsBackend";

export async function POST(
  req: Request,
  { params }: { params: { uploadId: string } }
) {
  const url = new URL(req.url);
  return forwardStreamingPost(
    `/api/file-upload/${params.uploadId}/chunk${url.search}`,
    req
  );
}
