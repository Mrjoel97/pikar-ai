declare module 'jstat' {
  const jstat: {
    jStat: {
      chisquare: {
        test: (observed: number[][], df: number) => number;
      };
    };
  };
  export = jstat;
}