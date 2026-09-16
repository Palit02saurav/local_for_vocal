import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

async function request(method, path, body) {
  try {
    const res = await client.request({
      url: path,
      method,
      data: body,
    });
    return { data: res.data, status: res.status };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data ?? null;
    const wrapped = new Error(data?.message || `Request failed with status ${status}`);
    wrapped.status = status;
    wrapped.data = data;
    throw wrapped;
  }
}

const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};

export default api;