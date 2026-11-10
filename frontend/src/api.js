
const API_BASE_URL = "http://localhost:5000";

export async function uploadCSV(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  let result;

  try {
    result = await response.json();
    console.log("CONSUMERPULSE API RESPONSE:", result);
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || result.error || "CSV upload failed."
    );
  }

  return result;
}
