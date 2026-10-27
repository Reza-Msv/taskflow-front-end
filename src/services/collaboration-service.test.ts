import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  collaborationService,
  COLLABORATION_ENDPOINTS,
} from "./collaboration-service";
import { apiClient } from "./api-client";
import type {
  WorkItemCommentResponse,
  WorkItemCommentListResponse,
  MentionableUserResponse,
} from "./generated/api-types";

vi.mock("./api-client", () => ({
  apiClient: vi.fn(),
}));

describe("collaborationService", () => {
  const orgId = "org-1";
  const projectId = "proj-1";
  const taskId = "task-1";
  const commentId = "comm-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches paginated comments", async () => {
    const mockList: WorkItemCommentListResponse = {
      items: [
        {
          id: commentId,
          work_item_id: taskId,
          content: "Hello @Alice",
          is_edited: false,
          created_at: "2026-10-20T10:00:00Z",
          updated_at: "2026-10-20T10:00:00Z",
          mentions: [],
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    };

    vi.mocked(apiClient).mockResolvedValueOnce(mockList);

    const result = await collaborationService.getComments(orgId, projectId, taskId, {
      page: 1,
      page_size: 25,
    });

    expect(apiClient).toHaveBeenCalledWith(
      COLLABORATION_ENDPOINTS.comments(orgId, projectId, taskId) +
        "?page=1&page_size=25",
      { method: "GET" }
    );
    expect(result).toEqual(mockList);
  });

  it("creates a comment with mentions", async () => {
    const mockComment: WorkItemCommentResponse = {
      id: commentId,
      work_item_id: taskId,
      content: "Great job @Alice",
      is_edited: false,
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-20T10:00:00Z",
      mentions: [],
    };

    vi.mocked(apiClient).mockResolvedValueOnce(mockComment);

    const result = await collaborationService.createComment(
      orgId,
      projectId,
      taskId,
      {
        content: "Great job @Alice",
        mentioned_user_ids: ["user-alice-id"],
      }
    );

    expect(apiClient).toHaveBeenCalledWith(
      COLLABORATION_ENDPOINTS.comments(orgId, projectId, taskId),
      {
        method: "POST",
        body: JSON.stringify({
          content: "Great job @Alice",
          mentioned_user_ids: ["user-alice-id"],
        }),
      }
    );
    expect(result).toEqual(mockComment);
  });

  it("updates and deletes a comment", async () => {
    const updatedComment: WorkItemCommentResponse = {
      id: commentId,
      work_item_id: taskId,
      content: "Updated comment",
      is_edited: true,
      created_at: "2026-10-20T10:00:00Z",
      updated_at: "2026-10-20T10:05:00Z",
      mentions: [],
    };

    vi.mocked(apiClient).mockResolvedValueOnce(updatedComment);

    const result = await collaborationService.updateComment(
      orgId,
      projectId,
      taskId,
      commentId,
      { content: "Updated comment" }
    );

    expect(apiClient).toHaveBeenCalledWith(
      COLLABORATION_ENDPOINTS.comment(orgId, projectId, taskId, commentId),
      {
        method: "PATCH",
        body: JSON.stringify({ content: "Updated comment" }),
      }
    );
    expect(result.is_edited).toBe(true);

    vi.mocked(apiClient).mockResolvedValueOnce(undefined);
    await collaborationService.deleteComment(orgId, projectId, taskId, commentId);

    expect(apiClient).toHaveBeenCalledWith(
      COLLABORATION_ENDPOINTS.comment(orgId, projectId, taskId, commentId),
      { method: "DELETE" }
    );
  });

  it("fetches mentionable members with search query", async () => {
    const mockMembers: MentionableUserResponse[] = [
      {
        id: "u-1",
        email: "alice@test.com",
        full_name: "Alice Smith",
        role: "admin",
      },
    ];

    vi.mocked(apiClient).mockResolvedValueOnce(mockMembers);

    const result = await collaborationService.getMentionableMembers(
      orgId,
      projectId,
      taskId,
      "alice"
    );

    expect(apiClient).toHaveBeenCalledWith(
      COLLABORATION_ENDPOINTS.mentionableMembers(orgId, projectId, taskId) +
        "?search=alice",
      { method: "GET" }
    );
    expect(result).toEqual(mockMembers);

    // Also test project-scoped call without taskId
    vi.mocked(apiClient).mockResolvedValueOnce(mockMembers);
    const projResult = await collaborationService.getMentionableMembers(
      orgId,
      projectId,
      undefined,
      "alice"
    );
    expect(apiClient).toHaveBeenCalledWith(
      COLLABORATION_ENDPOINTS.mentionableMembers(orgId, projectId) +
        "?search=alice",
      { method: "GET" }
    );
    expect(projResult).toEqual(mockMembers);
  });
});
