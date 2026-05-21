import { firebaseAuth } from "../config/firebase.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      console.warn("No bearer token in request to:", req.path);
      return res.status(401).json({ message: "Missing bearer token" });
    }

    if (!firebaseAuth) {
      console.error("Firebase Admin is not configured");
      return res.status(503).json({ message: "Firebase Admin is not configured" });
    }

    let decoded;
    try {
      decoded = await firebaseAuth.verifyIdToken(token);
      console.log("Token verified for Firebase UID:", decoded.uid);
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError.message);
      return res.status(401).json({ message: "Invalid or expired token. Please sign in again." });
    }

    const user = await User.findOne({ firebaseUid: decoded.uid });
    console.log("User lookup for Firebase UID", decoded.uid, "found:", !!user);

    const isLoginRoute = req.originalUrl.split("?")[0].replace(/\/$/, "") === "/api/auth/login";

    if (!user && !isLoginRoute) {
      console.warn(`Blocking request to protected route: ${req.originalUrl} - User not found in database.`);
      return res.status(401).json({
        code: "AUTH_USER_NOT_FOUND",
        message: "Your account does not exist in the database. Please sign up to register."
      });
    }

    if (user && user.isActive === false) {
      console.warn(`Blocking request to protected route: ${req.originalUrl} - User account is disabled.`);
      return res.status(403).json({
        code: "AUTH_USER_DISABLED",
        message: "Your account has been disabled by an administrator. Please contact support to get it enabled again."
      });
    }

    req.firebaseUser = decoded;
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    next(error);
  }
}


