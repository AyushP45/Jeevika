/**
 * Jeevika Fraud Detection Service
 * ─────────────────────────────────
 * Analyses job verification sessions and returns:
 *   - trustScore        (0-100, higher = more trustworthy)
 *   - fraudProbability  (0-100, higher = more suspicious)
 *   - confidence        (0-100, how sure the engine is)
 *   - flags             (string[] of raised warnings)
 *   - verdict           ("clean" | "suspicious" | "flagged" | "high_risk")
 */

// Minimum durations (minutes) by job category
const CATEGORY_MIN_DURATIONS = {
  farming: 60,
  cleaning: 30,
  construction: 120,
  painting: 90,
  plumbing: 45,
  electrical: 60,
  carpentry: 60,
  domestic: 30,
  delivery: 20,
  default: 25
};

/**
 * Haversine distance between two lat/lng points in metres.
 */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Detect suspicious GPS ping patterns (teleportation, static position the whole time)
 */
function analyseGpsPings(pings) {
  const flags = [];
  if (!pings || pings.length < 2) return flags;

  let prevPing = null;
  let staticCount = 0;

  for (const ping of pings) {
    if (prevPing) {
      const dist = haversineMeters(prevPing.lat, prevPing.lng, ping.lat, ping.lng);
      const timeDiffSeconds = (new Date(ping.timestamp) - new Date(prevPing.timestamp)) / 1000;

      // Teleportation: moved > 5 km in < 60 seconds
      if (dist > 5000 && timeDiffSeconds < 60) {
        flags.push("GPS_TELEPORTATION_DETECTED");
      }

      // Exact same coordinates for 3+ consecutive pings = suspicious static
      if (dist < 1) staticCount++;
      else staticCount = 0;

      if (staticCount >= 3) {
        if (!flags.includes("WORKER_COMPLETELY_STATIC")) {
          flags.push("WORKER_COMPLETELY_STATIC");
        }
      }
    }
    prevPing = ping;
  }

  return flags;
}

/**
 * Primary analysis function — called once all evidence is submitted.
 * @param {object} verification - JobVerification record (plain object / .toJSON())
 * @param {object} job          - Job record
 * @param {object} workerHistory - { completedJobs, fraudFlags, cancellationRatio, disputeRatio }
 * @returns {object} { trustScore, fraudProbability, confidence, flags, verdict }
 */
export function analyseVerification(verification, job = {}, workerHistory = {}) {
  const flags = [];
  let penaltyPoints = 0; // accumulate → fraudProbability
  let bonusPoints = 0;   // accumulate → trustScore boost

  // ── 1. GPS Check-In Validation ──────────────────────────
  if (verification.checkInLat && verification.jobLat) {
    const dist = haversineMeters(
      verification.checkInLat, verification.checkInLng,
      verification.jobLat, verification.jobLng
    );
    const allowed = verification.allowedRadiusMeters || 500;
    if (dist > allowed * 3) {
      flags.push("CHECKIN_FAR_FROM_JOB_LOCATION");
      penaltyPoints += 30;
    } else if (dist > allowed) {
      flags.push("CHECKIN_OUTSIDE_ALLOWED_RADIUS");
      penaltyPoints += 15;
    } else {
      bonusPoints += 20; // within radius
    }
  } else {
    flags.push("NO_GPS_CHECKIN_DATA");
    penaltyPoints += 10;
  }

  // ── 2. Check-Out Location Match ─────────────────────────
  if (verification.checkOutLat && verification.jobLat) {
    const dist = haversineMeters(
      verification.checkOutLat, verification.checkOutLng,
      verification.jobLat, verification.jobLng
    );
    const allowed = verification.allowedRadiusMeters || 500;
    if (dist > allowed * 3) {
      flags.push("CHECKOUT_FAR_FROM_JOB_LOCATION");
      penaltyPoints += 20;
    } else {
      bonusPoints += 10;
    }
  }

  // ── 3. Duration Validation ───────────────────────────────
  const category = (job.category || "default").toLowerCase();
  const minMinutes = CATEGORY_MIN_DURATIONS[category] || CATEGORY_MIN_DURATIONS.default;
  const actualMinutes = verification.sessionDurationMinutes || 0;

  if (actualMinutes < 1) {
    flags.push("ZERO_SESSION_DURATION");
    penaltyPoints += 25;
  } else if (actualMinutes < minMinutes * 0.3) {
    flags.push("UNREALISTICALLY_SHORT_SESSION");
    penaltyPoints += 20;
  } else if (actualMinutes < minMinutes * 0.7) {
    flags.push("SUSPICIOUSLY_SHORT_SESSION");
    penaltyPoints += 10;
  } else {
    bonusPoints += 15;
  }

  // ── 4. Evidence Checks ──────────────────────────────────
  const beforeCount = Array.isArray(verification.beforeImages) ? verification.beforeImages.length : 0;
  const afterCount = Array.isArray(verification.afterImages) ? verification.afterImages.length : 0;

  if (beforeCount === 0) {
    flags.push("NO_BEFORE_IMAGES");
    penaltyPoints += 15;
  } else {
    bonusPoints += 10;
  }

  if (afterCount === 0) {
    flags.push("NO_AFTER_IMAGES");
    penaltyPoints += 20;
  } else if (afterCount >= 2) {
    bonusPoints += 15;
  }

  if (!verification.checkInSelfie) {
    flags.push("NO_CHECKIN_SELFIE");
    penaltyPoints += 10;
  } else {
    bonusPoints += 10;
  }

  // ── 4.1 Image Similarity Guard (Duplicate detection) ────
  if (beforeCount > 0 && afterCount > 0) {
    let duplicateDetected = false;
    for (const before of verification.beforeImages) {
      for (const after of verification.afterImages) {
        if (before === after) {
          duplicateDetected = true;
          break;
        }
      }
      if (duplicateDetected) break;
    }

    if (duplicateDetected) {
      flags.push("DUPLICATE_EVIDENCE_DETECTED");
      penaltyPoints += 50; // Very high penalty for submitting same photo twice
    }
  }

  // ── 5. GPS Ping Pattern Analysis ────────────────────────
  const pingFlags = analyseGpsPings(verification.gpsPings);
  flags.push(...pingFlags);
  penaltyPoints += pingFlags.length * 15;

  // ── 6. Metadata Consistency ─────────────────────────────
  if (verification.checkInTime && verification.checkOutTime) {
    const checkIn = new Date(verification.checkInTime);
    const checkOut = new Date(verification.checkOutTime);
    if (checkOut < checkIn) {
      flags.push("CHECKOUT_BEFORE_CHECKIN_TIMESTAMP");
      penaltyPoints += 30;
    }
  }

  // ── 7. Worker History Risk Signals ──────────────────────
  const fraudFlags = workerHistory.fraudFlags || 0;
  const disputeRatio = workerHistory.disputeRatio || 0;

  if (fraudFlags >= 3) {
    flags.push("HIGH_FRAUD_FLAG_HISTORY");
    penaltyPoints += 20;
  } else if (fraudFlags >= 1) {
    flags.push("PREVIOUS_FRAUD_FLAGS");
    penaltyPoints += 8;
  }

  if (disputeRatio > 0.4) {
    flags.push("HIGH_DISPUTE_RATIO");
    penaltyPoints += 15;
  }

  // High trust worker bonus
  const completedJobs = workerHistory.completedJobs || 0;
  if (completedJobs > 50) bonusPoints += 20;
  else if (completedJobs > 20) bonusPoints += 12;
  else if (completedJobs > 5) bonusPoints += 6;

  // ── 8. Score Calculation ────────────────────────────────
  // Penalty is capped at 100
  penaltyPoints = Math.min(penaltyPoints, 100);
  // Bonus is capped at 50
  bonusPoints = Math.min(bonusPoints, 50);

  const fraudProbability = Math.round(Math.max(0, penaltyPoints));
  const rawTrust = Math.max(0, 100 - penaltyPoints + bonusPoints * 0.5);
  const trustScore = Math.round(Math.min(rawTrust, 100));

  // Confidence: how much data we actually had to work with
  let dataPoints = 0;
  if (verification.checkInLat) dataPoints++;
  if (verification.checkOutLat) dataPoints++;
  if (beforeCount > 0) dataPoints++;
  if (afterCount > 0) dataPoints++;
  if (verification.checkInSelfie) dataPoints++;
  if (Array.isArray(verification.gpsPings) && verification.gpsPings.length > 0) dataPoints++;
  const confidence = Math.round((dataPoints / 6) * 100);

  // ── 9. Verdict ───────────────────────────────────────────
  let verdict;
  if (fraudProbability >= 70) verdict = "high_risk";
  else if (fraudProbability >= 40) verdict = "flagged";
  else if (fraudProbability >= 20) verdict = "suspicious";
  else verdict = "clean";

  return {
    trustScore,
    fraudProbability,
    confidence,
    flags,
    verdict
  };
}

/**
 * Calculate a persistent Trust Score for a user based on their overall history.
 * @returns number 0–100
 */
export function calculateUserTrustScore({
  completedJobs = 0,
  rating = 4.0,
  fraudFlags = 0,
  disputeRatio = 0,
  cancellationRatio = 0
}) {
  let score = 50; // base

  // Completed jobs boost
  score += Math.min(completedJobs * 0.5, 25);

  // Rating boost/penalty (neutral at 4.0)
  score += (rating - 4.0) * 10;

  // Fraud history penalty
  score -= fraudFlags * 8;

  // Dispute/cancellation penalty
  score -= disputeRatio * 30;
  score -= cancellationRatio * 15;

  return Math.round(Math.min(100, Math.max(0, score)));
}
