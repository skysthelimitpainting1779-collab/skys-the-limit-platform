import { check } from "k6";
import http from "k6/http";

const baseUrl = __ENV.BASE_URL ?? "http://127.0.0.1:3000";
if (!/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(baseUrl)) {
  throw new Error("Load pilot is restricted to a local server");
}
http.setResponseCallback(http.expectedStatuses(400));

export const options = {
  scenarios: {
    estimate_validation: {
      executor: "constant-vus",
      vus: 5,
      duration: "5s",
    },
  },
  thresholds: {
    checks: ["rate==1"],
    http_req_failed: ["rate==0"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function runEstimateValidationLoad() {
  const response = http.post(`${baseUrl}/api/estimate`, "{}", {
    headers: { "Content-Type": "application/json" },
  });
  check(response, {
    "invalid lead is rejected without persistence": (result) =>
      result.status === 400 && result.json("error") === "validation_failed",
  });
}
