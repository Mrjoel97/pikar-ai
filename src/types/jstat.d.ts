declare module 'jstat' {
  interface JStatChiSquare {
    test: (observed: number[][], df: number) => number;
  }
  interface JStat {
    chisquare: JStatChiSquare;
  }
  const jStat: JStat;
  export = jStat;
}