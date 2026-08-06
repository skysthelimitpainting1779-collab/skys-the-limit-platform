import type {
  CreatePostData,
  GetConnectUrlData,
  Zernio,
} from "@zernio/node";

import { getZernioClient } from "./client";

export type ZernioClientPort = Pick<
  Zernio,
  "accounts" | "connect" | "posts" | "profiles"
>;

export type ZernioConnectInput = {
  platform: GetConnectUrlData["path"]["platform"];
  profileId: string;
  redirectUrl?: string;
};

export type ZernioPostBody = CreatePostData["body"];

async function listZernioProfiles(
  client: ZernioClientPort = getZernioClient(),
) {
  const { data } = await client.profiles.listProfiles();
  return data;
}

async function listZernioAccounts(
  profileId?: string,
  client: ZernioClientPort = getZernioClient(),
) {
  const response = profileId
    ? await client.accounts.listAccounts({ query: { profileId } })
    : await client.accounts.listAccounts();

  return response.data;
}

async function getZernioConnectUrl(
  input: ZernioConnectInput,
  client: ZernioClientPort = getZernioClient(),
) {
  const query = input.redirectUrl
    ? { profileId: input.profileId, redirect_url: input.redirectUrl }
    : { profileId: input.profileId };

  const { data } = await client.connect.getConnectUrl({
    path: { platform: input.platform },
    query,
  });

  return data;
}

async function createZernioPost(
  body: ZernioPostBody,
  client: ZernioClientPort = getZernioClient(),
  liveSocialEnabled = process.env.ENABLE_LIVE_SOCIAL === "true",
) {
  if (!liveSocialEnabled) {
    throw new Error(
      "Zernio publishing is blocked. Set ENABLE_LIVE_SOCIAL=true only after explicit approval.",
    );
  }

  const { data } = await client.posts.createPost({ body });
  return data;
}

export {
  createZernioPost,
  getZernioConnectUrl,
  listZernioAccounts,
  listZernioProfiles,
};
