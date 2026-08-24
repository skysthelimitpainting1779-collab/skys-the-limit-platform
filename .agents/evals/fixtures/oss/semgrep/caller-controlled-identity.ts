async function unsafeAuthorization(request: Request) {
  const { orgId, role } = await request.json();
  return { orgId, role };
}

void unsafeAuthorization;
