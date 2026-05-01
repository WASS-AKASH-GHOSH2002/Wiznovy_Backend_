export const decimalTransformer = {
  to: (v: number) => v,
  from: (v: any) => (v !== null && v !== undefined ? parseFloat(Number(v).toFixed(2)) : v),
};
