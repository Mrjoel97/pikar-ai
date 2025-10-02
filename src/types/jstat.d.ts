declare module 'jstat' {
  export const jStat: {
    chisquare: {
      test: (observed: number[][], df: number) => number;
    };
  };
}