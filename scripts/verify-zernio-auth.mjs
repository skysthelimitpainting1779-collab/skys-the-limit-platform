import Zernio from "@zernio/node";

const apiKey = process.env.ZERNIO_API_KEY?.trim();

if (!apiKey) {
  console.error("✗ ZERNIO_API_KEY is not configured.");
  process.exit(1);
}

try {
  const zernio = new Zernio({ apiKey });
  const [{ data: profileData }, { data: accountData }] = await Promise.all([
    zernio.profiles.listProfiles(),
    zernio.accounts.listAccounts(),
  ]);

  const profiles = Array.isArray(profileData?.profiles)
    ? profileData.profiles.length
    : 0;
  const accounts = Array.isArray(accountData?.accounts)
    ? accountData.accounts.length
    : 0;

  console.log(
    `✓ Zernio credential verified — ${profiles} profile(s), ${accounts} connected account(s).`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown Zernio error";
  console.error(`✗ Zernio credential verification failed: ${message}`);
  process.exit(1);
}
