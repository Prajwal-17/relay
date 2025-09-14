// query = ""
// pagesize = 20 elements
// pageno = 1
export const fetchProducts = async ({ query, pageSize, pageNo }: any) => {
  const response = await window.productsApi.search(query, pageNo, pageSize);
  return {
    response
  };
};

// export const fetchSales = async ({ query, limit, offset }: any) => {
//   const response = await window.salesApi.(query, offset, limit);
//   return {
//     data: response
//   };
// };
