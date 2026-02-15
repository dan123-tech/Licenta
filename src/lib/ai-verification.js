/**
 * AI Verification – call the AI Docker service to verify driving licence experience.
 * Base URL: AI_VERIFICATION_URL (default http://localhost:8080)
 * Expects: POST with image (multipart/form-data "file" or "image"), JSON response with
 *   hasTwoPlusYearsExperience / has_two_plus_years_experience / approved (boolean).
 * If true → approve (2+ years), if false → reject.
 */

const DEFAULT_AI_URL = process.env.AI_VERIFICATION_URL || "http://localhost:8080";
const AI_VERIFY_PATH = process.env.AI_VERIFY_PATH || "/verify";
const AI_TIMEOUT_MS = parseInt(process.env.AI_VERIFICATION_TIMEOUT_MS || "30000", 10);

/**
 * Send the driving licence image to the AI service and get whether the user has 2+ years experience.
 * @param {Buffer} imageBuffer - Raw image bytes
 * @param {string} mimeType - e.g. "image/jpeg"
 * @param {string} [filename] - Optional filename for the part
 * @returns {Promise<{ hasTwoPlusYearsExperience: boolean, raw?: object }>}
 */
export async function verifyDrivingLicenceWithAI(imageBuffer, mimeType, filename = "driving-licence.jpg") {
  const url = `${DEFAULT_AI_URL.replace(/\/$/, "")}${AI_VERIFY_PATH}`;
  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType || "image/jpeg" });
  form.append("file", blob, filename);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
      headers: {}, // FormData sets Content-Type with boundary
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("AI verification timed out. Please try again or ask an admin to review.");
    }
    const msg = err?.message || String(err);
    if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      throw new Error("AI verification service is not reachable. Your licence was saved and is pending manual review.");
    }
    throw new Error("AI verification failed: " + msg);
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      res.status === 503 || res.status === 502
        ? "AI verification service is temporarily unavailable. Your licence is pending manual review."
        : `AI verification returned ${res.status}: ${text.slice(0, 200)}`
    );
  }
  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("AI verification returned invalid response. Your licence is pending manual review.");
    }
  }
  const hasTwoPlusYearsExperience =
    data?.hasTwoPlusYearsExperience === true ||
    data?.has_two_plus_years_experience === true ||
    (typeof data?.approved === "boolean" && data.approved === true);
  return {
    hasTwoPlusYearsExperience: Boolean(hasTwoPlusYearsExperience),
    raw: data,
  };
}
