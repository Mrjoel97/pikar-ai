declare module 'jstat' {
  export interface JStatChiSquare {
    test: (observed: number[][], df: number) => number;
  }

  export interface JStat {
    chisquare: JStatChiSquare;
  }

  export const jStat: JStat;
}