/**
 * Action Tailor - Hardened Pagination Utility
 * Safely parses and bounds page and limit parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function parsePagination(query: any, defaultLimit = 20): PaginationParams {
  let page = parseInt(query?.page as string, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query?.limit as string, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > 100) {
    limit = 100;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

