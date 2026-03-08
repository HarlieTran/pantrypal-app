import { useState } from "react";
import { getUploadUrl, createPost } from "../infra/community.api";
import type { CommunityPostView } from "../model/community.types";

type CreatePostInput = {
  caption: string;
  tags?: string[];
  topicId?: string;
  imageFile?: File;
};

type UseCreatePostResult = {
  submit: (input: CreatePostInput) => Promise<CommunityPostView>;
  loading: boolean;
  error: string | null;
};

export function useCreatePost(token: string): UseCreatePostResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(input: CreatePostInput): Promise<CommunityPostView> {
    setLoading(true);
    setError(null);

    try {
      let imageS3Key: string | undefined;

      if (input.imageFile) {
        const { uploadUrl, imageKey } = await getUploadUrl(
          token,
          input.imageFile.name,
          input.imageFile.type,
        );

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": input.imageFile.type },
          body: input.imageFile,
        });

        if (!uploadRes.ok) throw new Error("Image upload failed");
        imageS3Key = imageKey;
      }

      const post = await createPost(token, {
        caption: input.caption,
        tags: input.tags,
        topicId: input.topicId,
        imageS3Key,
      });

      return post;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, error };
}