#!/usr/bin/env node
// Scenario checks for the pure routing rules in src/lib/session/landing.ts (no server, no browser).
// IDs (SES-L01 ...) match docs/test-scenarios.md.  Run: node scripts/check-landing.mjs
// Node 23.6+ strips the TypeScript types when importing the .ts file directly.
import assert from "node:assert/strict";
import { canAccess, postAuthDestination, resolveLanding, safeNext } from "../src/lib/session/landing.ts";

const kos = (id) => ({ id, name: id, city: "X", ownerName: "O", readOnly: false });
const membership = (kosId, onboardingComplete = true, role = "caretaker") => ({
  id: `m_${kosId}`,
  role,
  kos: kos(kosId),
  roomId: null,
  roomName: null,
  onboardingComplete,
  pendingRequestCount: 0,
});
const request = (status) => ({ id: "r1", kosName: "K", role: "tenant", status, createdAt: "2026-01-01T00:00:00Z" });
const me = ({ verified = true, intent = "owner", memberships = [], joinRequests = [] } = {}) => ({
  user: { id: "u", fullName: "U", email: "u@x.dev", phone: null, intent, plan: "free", verified, verification: null },
  memberships,
  joinRequests,
  canAddKos: true,
});

const scenarios = [];
const S = (id, title, fn) => scenarios.push({ id, title, fn });

S("SES-L01", "an unverified account always lands on /verify, whatever else it has", () => {
  for (const intent of ["owner", "tenant", "caretaker"]) {
    assert.equal(resolveLanding(me({ verified: false, intent })), "/verify");
  }
  assert.equal(resolveLanding(me({ verified: false, memberships: [membership("k1")] })), "/verify");
  assert.equal(resolveLanding(me({ verified: false, joinRequests: [request("pending")] })), "/verify");
});
S("SES-L02", "a verified owner with nothing yet lands on the first-kos setup", () => {
  assert.equal(resolveLanding(me({ intent: "owner" })), "/onboarding/owner");
});
S("SES-L03", "a verified resident or caretaker with nothing yet lands on Join a kos", () => {
  assert.equal(resolveLanding(me({ intent: "tenant" })), "/join");
  assert.equal(resolveLanding(me({ intent: "caretaker" })), "/join");
});
S("SES-L04", "a pending join request keeps the person on /join, even an owner-intent one", () => {
  for (const intent of ["owner", "tenant", "caretaker"]) {
    assert.equal(resolveLanding(me({ intent, joinRequests: [request("pending")] })), "/join");
  }
});
S("SES-L05", "a rejected request alone doesn't trap anyone on /join", () => {
  assert.equal(resolveLanding(me({ intent: "owner", joinRequests: [request("rejected")] })), "/onboarding/owner");
  assert.equal(resolveLanding(me({ intent: "tenant", joinRequests: [request("rejected")] })), "/join");
});
S("SES-L06", "a person with a finished membership lands on the app", () => {
  assert.equal(resolveLanding(me({ memberships: [membership("k1")] })), "/app");
  assert.equal(resolveLanding(me({ memberships: [membership("k1"), membership("k2")] })), "/app");
});
S("SES-L07", "an unfinished membership sends the person to that kos's onboarding first", () => {
  assert.equal(resolveLanding(me({ memberships: [membership("k1", false)] })), "/onboarding/guest/k1");
});
S("SES-L08", "with two memberships, the unfinished one wins", () => {
  assert.equal(resolveLanding(me({ memberships: [membership("k1"), membership("k2", false)] })), "/onboarding/guest/k2");
});
S("SES-L09", "with several unfinished memberships, the first one is handled first", () => {
  const m = me({ memberships: [membership("k1", false), membership("k2", false)] });
  assert.equal(resolveLanding(m), "/onboarding/guest/k1");
});
S("SES-L10", "a membership beats a pending request and the intent", () => {
  const m = me({ intent: "owner", memberships: [membership("k1")], joinRequests: [request("pending")] });
  assert.equal(resolveLanding(m), "/app");
});

S("SES-L11", "/verify is only for unverified accounts", () => {
  assert.equal(canAccess(me({ verified: false }), "verify"), true);
  assert.equal(canAccess(me({ verified: true }), "verify"), false);
});
S("SES-L12", "an unverified account can't reach any other stage", () => {
  const m = me({ verified: false, memberships: [membership("k1", false)] });
  for (const stage of ["join", "onboarding-owner", "onboarding-guest", "app"]) {
    assert.equal(canAccess(m, stage, "k1"), false, stage);
  }
});
S("SES-L13", "any verified person may open /join (a caretaker can take on a second kos)", () => {
  assert.equal(canAccess(me(), "join"), true);
  assert.equal(canAccess(me({ memberships: [membership("k1")] }), "join"), true);
});
S("SES-L14", "first-kos setup is only for people with no membership at all", () => {
  assert.equal(canAccess(me(), "onboarding-owner"), true);
  assert.equal(canAccess(me({ memberships: [membership("k1")] }), "onboarding-owner"), false);
});
S("SES-L15", "guest onboarding is only for your own unfinished membership in that kos", () => {
  const m = me({ memberships: [membership("k1", false), membership("k2", true)] });
  assert.equal(canAccess(m, "onboarding-guest", "k1"), true);
  assert.equal(canAccess(m, "onboarding-guest", "k2"), false, "already finished");
  assert.equal(canAccess(m, "onboarding-guest", "k3"), false, "not a member");
  assert.equal(canAccess(m, "onboarding-guest", undefined), false, "no kos given");
});
S("SES-L16", "the app needs at least one membership", () => {
  assert.equal(canAccess(me(), "app"), false);
  assert.equal(canAccess(me({ memberships: [membership("k1")] }), "app"), true);
});
S("SES-L17", "no redirect loops: the landing page of every reachable account state admits that state", () => {
  const stageOf = (path) => {
    if (path === "/verify") return ["verify"];
    if (path === "/join") return ["join"];
    if (path === "/onboarding/owner") return ["onboarding-owner"];
    if (path === "/app") return ["app"];
    const guest = path.match(/^\/onboarding\/guest\/(.+)$/);
    return guest ? ["onboarding-guest", guest[1]] : null;
  };
  const membershipSets = [[], [membership("k1")], [membership("k1", false)], [membership("k1"), membership("k2", false)], [membership("k1", false), membership("k2", false)]];
  const requestSets = [[], [request("pending")], [request("rejected")], [request("rejected"), request("pending")]];
  let checked = 0;
  for (const verified of [true, false]) {
    for (const intent of ["owner", "tenant", "caretaker"]) {
      for (const memberships of membershipSets) {
        for (const joinRequests of requestSets) {
          const state = me({ verified, intent, memberships, joinRequests });
          const landing = resolveLanding(state);
          const target = stageOf(landing);
          assert.ok(target, `unknown landing ${landing}`);
          assert.equal(canAccess(state, target[0], target[1]), true, `${landing} rejects its own state ${JSON.stringify({ verified, intent, memberships: memberships.length, joinRequests: joinRequests.length })}`);
          checked += 1;
        }
      }
    }
  }
  assert.equal(checked, 2 * 3 * 5 * 4);
});

S("SES-L18", "safeNext keeps same-site paths, including query strings", () => {
  assert.equal(safeNext("/app"), "/app");
  assert.equal(safeNext("/app/k/kos_melati?tab=people"), "/app/k/kos_melati?tab=people");
  assert.equal(safeNext("/invite/inv_x?auto=1"), "/invite/inv_x?auto=1");
});
S("SES-L19", "safeNext refuses anything that could leave the site", () => {
  for (const bad of ["//evil.com", "https://evil.com", "http://evil.com/app", "/\\evil.com", "javascript:alert(1)", "app", "", null, undefined]) {
    assert.equal(safeNext(bad), null, String(bad));
  }
});
S("SES-L20", "after login, verifying and unfinished onboarding always come before `next`", () => {
  assert.equal(postAuthDestination(me({ verified: false }), "/app"), "/verify");
  assert.equal(postAuthDestination(me({ memberships: [membership("k1", false)] }), "/app/k/x"), "/onboarding/guest/k1");
});
S("SES-L21", "after login, a safe `next` is honoured once nothing else is pending", () => {
  const done = me({ memberships: [membership("k1")] });
  assert.equal(postAuthDestination(done, "/app/k/k1"), "/app/k/k1");
  assert.equal(postAuthDestination(done, "https://evil.com"), "/app");
  assert.equal(postAuthDestination(done, null), "/app");
});
S("SES-L22", "a person with no kos yet can still follow an invite link as `next`", () => {
  assert.equal(postAuthDestination(me({ intent: "tenant" }), "/invite/inv_x"), "/invite/inv_x");
  assert.equal(postAuthDestination(me({ intent: "owner" }), "/invite/inv_x"), "/invite/inv_x");
  assert.equal(postAuthDestination(me({ intent: "tenant" }), null), "/join");
});

let failed = 0;
for (const scenario of scenarios) {
  try {
    scenario.fn();
    console.log(`  PASS  ${scenario.id.padEnd(8)} ${scenario.title}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${scenario.id.padEnd(8)} ${scenario.title}\n        ${String(error.message).split("\n").join("\n        ")}`);
  }
}
console.log(`\n${scenarios.length - failed}/${scenarios.length} routing scenarios passed`);
process.exit(failed ? 1 : 0);
