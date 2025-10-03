declare module "jstat" {
  export namespace jStat {
    namespace chisquare {
      function test(observed: number[][], df: number): number;
    }
  }
  const jstat: any;
  export default jstat;
}