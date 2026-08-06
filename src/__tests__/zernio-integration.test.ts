import { describe, expect, it, vi } from "vitest";

import {
  createZernioPost,
  getZernioConnectUrl,
  listZernioAccounts,
  listZernioProfiles,
  type ZernioClientPort,
} from "../lib/zernio/service";

function createFakeClient() {
  return {
    profiles: {
      listProfiles: vi.fn().mockResolvedValue({
        data: { profiles: [{ id: "profile_1", name: "Sky's the Limit" }] },
      }),
    },
    accounts: {
      listAccounts: vi.fn().mockResolvedValue({
        data: { accounts: [{ id: "account_1", platform: "facebook" }] },
      }),
    },
    connect: {
      getConnectUrl: vi.fn().mockResolvedValue({
        data: { authUrl: "https://zernio.com/connect/example" },
      }),
    },
    posts: {
      createPost: vi.fn().mockResolvedValue({
        data: { id: "post_1", status: "scheduled" },
      }),
    },
  };
}

describe("Zernio integration boundary", () => {
  it("lists profiles through the official SDK namespace", async () => {
    const fake = createFakeClient();

    const result = await listZernioProfiles(fake as unknown as ZernioClientPort);

    expect(result.profiles).toHaveLength(1);
    expect(fake.profiles.listProfiles).toHaveBeenCalledOnce();
  });

  it("filters connected accounts by profile", async () => {
    const fake = createFakeClient();

    await listZernioAccounts(
      "profile_1",
      fake as unknown as ZernioClientPort,
    );

    expect(fake.accounts.listAccounts).toHaveBeenCalledWith({
      query: { profileId: "profile_1" },
    });
  });

  it("creates a hosted OAuth URL with the exact SDK request shape", async () => {
    const fake = createFakeClient();

    const result = await getZernioConnectUrl(
      {
        platform: "facebook",
        profileId: "profile_1",
        redirectUrl: "https://preview.example.com/admin/integrations/zernio",
      },
      fake as unknown as ZernioClientPort,
    );

    expect(result.authUrl).toContain("zernio.com");
    expect(fake.connect.getConnectUrl).toHaveBeenCalledWith({
      path: { platform: "facebook" },
      query: {
        profileId: "profile_1",
        redirect_url: "https://preview.example.com/admin/integrations/zernio",
      },
    });
  });

  it("blocks post creation unless live social publishing is explicitly enabled", async () => {
    const fake = createFakeClient();

    await expect(
      createZernioPost(
        {
          content: "This must not publish.",
          platforms: [{ platform: "facebook", accountId: "account_1" }],
          publishNow: true,
        },
        fake as unknown as ZernioClientPort,
        false,
      ),
    ).rejects.toThrow("ENABLE_LIVE_SOCIAL=true");
    expect(fake.posts.createPost).not.toHaveBeenCalled();
  });

  it("passes an approved post body unchanged to posts.createPost", async () => {
    const fake = createFakeClient();
    const body = {
      content: "Approved scheduled update.",
      platforms: [{ platform: "facebook" as const, accountId: "account_1" }],
      scheduledFor: "2026-08-07T15:00:00.000Z",
    };

    const result = await createZernioPost(
      body,
      fake as unknown as ZernioClientPort,
      true,
    );

    expect(result.id).toBe("post_1");
    expect(fake.posts.createPost).toHaveBeenCalledWith({ body });
  });
});
