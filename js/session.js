async function checkSession() {
  try {
    const response = await fetch("/api/session", {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return null;
    }

    return data.customer;
  } catch (error) {
    console.error("Session check error:", error);
    return null;
  }
}