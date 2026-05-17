// Re-export shim: canonical implementation lives in components/shared/Pagination.tsx.
// Kept so legacy imports at "components/admin/Pagination" keep resolving while
// Plan 06-02 (admin) and Plan 06-03 (public page) migrate to the shared path.
export { default } from "../shared/Pagination";
