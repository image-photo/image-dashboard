import { createClient } from "npm:@supabase/supabase-js@2.105.3";
import { corsHeaders } from "npm:@supabase/supabase-js@2.105.3/cors";

type AdminAction = "list" | "invite" | "update";
type StudioRole = "admin" | "staff";

type RequestBody = {
  action?: AdminAction;
  active?: boolean;
  email?: string;
  fullName?: string;
  redirectTo?: string;
  role?: StudioRole;
  userId?: string;
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

const messageFromError = (error: unknown) =>
  error instanceof Error ? error.message : "An unexpected error occurred.";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const accessToken = authorization.replace(/^Bearer\s+/i, "");
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: actor },
      error: actorError,
    } = await userClient.auth.getUser(accessToken);

    if (actorError || !actor) {
      return jsonResponse({ error: "Your session is no longer valid." }, 401);
    }

    const { data: actorProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role, active")
      .eq("id", actor.id)
      .single();

    if (
      profileError ||
      !actorProfile ||
      actorProfile.role !== "admin" ||
      actorProfile.active !== true
    ) {
      return jsonResponse({ error: "Administrator access is required." }, 403);
    }

    const body = (await request.json()) as RequestBody;

    if (body.action === "list") {
      const { data: authData, error: usersError } =
        await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });

      if (usersError) throw usersError;

      const authUsers = authData.users;
      const userIds = authUsers.map((user) => user.id);
      const { data: profiles, error: profilesError } = userIds.length
        ? await adminClient
            .from("profiles")
            .select("id, full_name, role, active, created_at")
            .in("id", userIds)
        : { data: [], error: null };

      if (profilesError) throw profilesError;

      const profilesById = new Map(
        (profiles ?? []).map((profile) => [profile.id, profile])
      );
      const users = authUsers
        .map((user) => {
          const profile = profilesById.get(user.id);

          return {
            id: user.id,
            email: user.email ?? "",
            fullName: profile?.full_name ?? "Studio User",
            role: profile?.role ?? "staff",
            active: profile?.active ?? false,
            createdAt: user.created_at,
            confirmedAt: user.email_confirmed_at ?? null,
            lastSignInAt: user.last_sign_in_at ?? null,
            isCurrentUser: user.id === actor.id,
          };
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      return jsonResponse({ users });
    }

    if (body.action === "invite") {
      const email = body.email?.trim().toLowerCase() ?? "";
      const fullName = body.fullName?.trim() ?? "";
      const role = body.role;

      if (!email || !email.includes("@")) {
        return jsonResponse({ error: "Enter a valid email address." }, 400);
      }

      if (!fullName) {
        return jsonResponse({ error: "Enter the team member's full name." }, 400);
      }

      if (role !== "admin" && role !== "staff") {
        return jsonResponse({ error: "Choose a valid account role." }, 400);
      }

      const requestOrigin = request.headers.get("Origin");
      let redirectTo: string | undefined;

      if (body.redirectTo && requestOrigin) {
        const requestedRedirect = new URL(body.redirectTo);

        if (
          requestedRedirect.origin !== requestOrigin ||
          requestedRedirect.pathname !== "/reset-password"
        ) {
          return jsonResponse({ error: "The invite redirect URL is not allowed." }, 400);
        }

        redirectTo = requestedRedirect.toString();
      }

      const { data: inviteData, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName },
          redirectTo,
        });

      if (inviteError) throw inviteError;

      const invitedUserId = inviteData.user?.id;

      if (!invitedUserId) {
        throw new Error("Supabase did not return the invited user.");
      }

      const { error: activateError } = await adminClient
        .from("profiles")
        .update({ full_name: fullName, role, active: true })
        .eq("id", invitedUserId);

      if (activateError) {
        await adminClient.auth.admin.deleteUser(invitedUserId);
        throw activateError;
      }

      return jsonResponse({ message: `An invitation was sent to ${email}.` }, 201);
    }

    if (body.action === "update") {
      const userId = body.userId ?? "";
      const fullName = body.fullName?.trim() ?? "";
      const role = body.role;
      const active = body.active;

      if (!isUuid(userId)) {
        return jsonResponse({ error: "Choose a valid team member." }, 400);
      }

      if (!fullName) {
        return jsonResponse({ error: "A full name is required." }, 400);
      }

      if (role !== "admin" && role !== "staff") {
        return jsonResponse({ error: "Choose a valid account role." }, 400);
      }

      if (typeof active !== "boolean") {
        return jsonResponse({ error: "Choose a valid account status." }, 400);
      }

      const { data: currentProfile, error: currentProfileError } =
        await adminClient
          .from("profiles")
          .select("id, role, active")
          .eq("id", userId)
          .single();

      if (currentProfileError || !currentProfile) {
        return jsonResponse({ error: "That team member no longer exists." }, 404);
      }

      if (userId === actor.id && (role !== "admin" || !active)) {
        return jsonResponse(
          { error: "You cannot remove your own administrator access." },
          400
        );
      }

      const removesActiveAdmin =
        currentProfile.role === "admin" &&
        currentProfile.active === true &&
        (role !== "admin" || active !== true);

      if (removesActiveAdmin) {
        const { count, error: countError } = await adminClient
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin")
          .eq("active", true);

        if (countError) throw countError;

        if ((count ?? 0) <= 1) {
          return jsonResponse(
            { error: "The studio must keep at least one active administrator." },
            400
          );
        }
      }

      const { data: updatedProfile, error: updateError } = await adminClient
        .from("profiles")
        .update({ full_name: fullName, role, active })
        .eq("id", userId)
        .select("id, full_name, role, active")
        .single();

      if (updateError) throw updateError;

      return jsonResponse({ profile: updatedProfile });
    }

    return jsonResponse({ error: "Choose a valid administrator action." }, 400);
  } catch (error) {
    console.error("admin-users error", error);
    return jsonResponse({ error: messageFromError(error) }, 400);
  }
});
