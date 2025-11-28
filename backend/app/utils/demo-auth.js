// Demo mode authentication - bypasses real auth
// Sets a mock user for all requests

export const demoAuthenticate = (req, res, next) => {
  // Set a default demo user
  // You can switch roles by adding ?role=contractor or ?role=homeowner to any request
  const role = req.query.role || "homeowner";

  if (role === "contractor") {
    req.user = {
      id: "demo-contractor-1",
      email: "demo.contractor@lawnr.com",
      role: "contractor",
    };
  } else if (role === "admin") {
    req.user = {
      id: "demo-admin-1",
      email: "demo.admin@lawnr.com",
      role: "admin",
    };
  } else {
    req.user = {
      id: "demo-homeowner-1",
      email: "demo.homeowner@lawnr.com",
      role: "homeowner",
    };
  }

  next();
};

export const demoAuthorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: "Not authenticated" } });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // In demo mode, allow all roles for testing
      console.log(
        `⚠️  Demo mode: Allowing ${
          req.user.role
        } access (normally requires: ${allowedRoles.join(", ")})`
      );
    }

    next();
  };
};
