export const fetchProducts = async (query, pageNo, pageSize) => {
  const response = await window.productsApi.search(query, pageNo, pageSize);
  return {
    ...response
  };
};
